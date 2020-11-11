:;exec emacs -Q -batch -l "$0" -f main "$@"
;; NOTE: not loading anything from init file

;; had a lot of trouble with the normal org mode exporter, so I wrote my own
;; this still uses the org-html export scripts, but the pages themselves are
;; generated using mustache templates.
;; troubles with org mode:
;; - changing emacs config breaks the blog (fixed by running in a "container")
;; - rss feed keeps breaking and is inflexible

;;; Code:
(defvar site-dst
  "_site"
  "Location site rendered to.")

(defvar site-root-uuid
  "7347f00a-9370-4040-8df4-0a5e8921963b"
  "Random UUID generated to use as namespace for post UUIDs.")

(defun path-concat (a b)
  "Concatenate two paths A and B."
  (concat (file-name-as-directory a) b))

(defun get-string-from-file (path)
  "Return contents of PATH."
  (with-temp-buffer
    (insert-file-contents path)
    (buffer-string)))

(defun setup-env ()
  "Setup env and packages for site builder.
Straight lives in a little container, unaffected by the actual system Emacs."
  (let ((bootstrap-file (expand-file-name
                         (path-concat command-line-default-directory
                                      "_straight/straight/repos/straight.el/bootstrap.el")))
        ;; weird path!
        ;; straight installer does stuff to paths, so have to hack this
        (install-file (expand-file-name
                       (path-concat command-line-default-directory
                                    "_straight/repos/straight.el/install.el"))))
    (setq straight-base-dir
          (expand-file-name (path-concat command-line-default-directory
                                         "_straight")))
    (setq bootstrap-version 5)
    (unless (file-exists-p install-file)
      (make-directory (file-name-directory install-file) t)
      (url-copy-file
       "https://raw.githubusercontent.com/raxod502/straight.el/develop/install.el"
       install-file)
      (load install-file))
    (load bootstrap-file))

  (straight-use-package 'use-package)

  ;; org export uses color schemes from emacs and emacs syntax highlighters
  (use-package base16-theme
    :straight t
    :config (load-theme 'base16-tomorrow-night t))
  (use-package rust-mode
    :straight t)

  ;; packages for actually rendering
  (use-package ht
    :straight t)
  (use-package mustache
    :straight t)
  (use-package org
    :straight t)
  (use-package htmlize
    :straight t)
  (require 'org-element)

  ;; Don't do much with the theme. We'll generate the entire theme using
  ;; css from our emacs color scheme. This tells htmlize to use css
  ;; classes to annotate the stuff it would have generated colors for.
  ;; we inject an expored base16 css file in the static dir
  (setq org-html-htmlize-output-type 'css)
  (setq org-export-with-sub-superscripts nil))

(defun generate-unique-id (filename)
  "Generate a unique id for FILENAME. Stable as long as the SITE-ROOT-UUID doesn't change."
  (with-temp-buffer
    (shell-command (format "uuidgen --namespace %s --name %s --sha1"
                           site-root-uuid
                           (file-name-base filename))
                   t)
    (string-trim (buffer-string))))

(defun render-post-html (filename)
  "Render the post described in FILENAME to html in a string."
  (with-temp-buffer
    (insert-file-contents filename)
    (org-html-export-as-html nil nil nil t `(:html-doctype "html5"
                                             :html-html5-fancy t
                                             :htmlized-source t
                                             :with-toc nil
                                             :section-numbers nil
                                             )))
  (with-current-buffer "*Org HTML Export*"
    (buffer-string)))

(defun get-props (filename)
  (with-temp-buffer
    (insert-file-contents filename)

    ;; find all of the keyword elements in the buffer
    (apply
     'ht-merge

     ;; include filename
     (ht
      ("FILENAME"  filename)
      ("PERMALINK" (concat "posts/" (file-name-base filename) ".html"))
      ("UUID"      (generate-unique-id filename))
      ("BODY"      (render-post-html filename)))

     ;; and all other keyword elements
     (org-element-map
         (org-element-parse-buffer)
         'keyword
       (lambda (el)
         (let ((nm (org-element-property :key el))
               (val (string-trim (org-element-property :value el))))
           (if (string= nm "DATE")
               (ht (nm (substring val 1 -1)))
             (ht (nm val)))))))))

(defun site-get-posts (posts-directory)
  "Find all org files in POSTS-DIRECTORY."
  (let ((files (directory-files posts-directory t "^[^\.]+.*.org")))
    (mapcar #'get-props files)))

(defun site-copy-dir (dir &optional target)
  "Copy a directory from DIR to resulting output `site-dst`/TARGET."
  (unless target (setq target dir))
  (copy-directory dir (path-concat site-dst target)))

(defun main ()
  "Entrypoint to site generator script."
  (setup-env)

  (message "Generating site...")
  (delete-directory site-dst t)

  ;; create the directory
  (shell-command
   (format "git clone git@github.com:dpzmick/dpzmick.github.com.git %s" site-dst))

  ;; clear out existing site completely, we'll regenerate everything and git
  ;; should report no diffs. FIXME do this with emacs not shell
  (shell-command
   (format "rm -r %s/*" site-dst))
  (make-directory (path-concat site-dst "posts/"))

  ;; find all of the posts
  ;; each is a hash-table
  (setq site-posts (site-get-posts "posts")) ;; FIXME sort these

  (setq b (get-string-from-file "templates/index.mustache"))
  (with-temp-file (path-concat site-dst "index.html")
    (insert (mustache-render b (ht ("posts" (reverse site-posts))))))

  (setq b (get-string-from-file "templates/feed.mustache"))
  (with-temp-file (path-concat site-dst "feed.xml")
    (insert (mustache-render b (ht ("posts" (reverse site-posts))))))

  (setq b (get-string-from-file "templates/post.mustache"))
  (mapc
   (lambda (post)
     (message (ht-get post "FILENAME"))
     (with-temp-file (path-concat site-dst (ht-get post "PERMALINK"))
       (insert (mustache-render b post))))
   site-posts)

  (copy-file "CNAME" (path-concat site-dst "CNAME"))
  (site-copy-dir "static"))

;; Local Variables:
;; mode: emacs-lisp
;; End:
