Place local root CA certificates in this directory when your network intercepts
TLS traffic before it reaches Docker containers.

Files ending in `.crt` are copied into the image and installed with
`update-ca-certificates` during `docker compose build`.

For example, on this machine Docker sees RubyGems certificates issued by
`Somansa Root CA`, which is trusted by macOS but not by the base image.
