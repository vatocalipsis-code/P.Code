# Browser file delivery

`createPCodeHost(...).deliverFile({text, filename, mediaType})` delivers a semantic
export result. The application owns serialization and filename policy. Picot's
browser host owns the transient download element, object URL and cleanup.

The call is synchronous to retain user activation. It returns
`{status: 'requested'}`: the browser owns the save/cancel decision. It does not
claim a successful save to disk. Exceptions propagate to the caller.

Text is encoded as UTF-8 by Blob without rewriting BOM, newlines or numerical
values. Filenames cannot contain path separators, controls or reserved filename
characters. Only MIME type metadata is accepted, never an external URL or HTML.
The link is hidden and removed immediately; the object URL is released after
60 seconds, or immediately if attachment/activation fails. No listeners,
network requests or download state are added to the application.
