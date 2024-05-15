
![logo](https://github.com/mattkrins/bitwarden-to-keepass/assets/2367602/39dfad90-30e3-4dab-b3d0-9c65b3d07c4e)

# bitwarden-to-keepass
[![Static Badge](https://img.shields.io/badge/docker-docker?style=social&logo=docker)](https://hub.docker.com/r/mattkrins/bitwarden-to-keepass)
![GitHub License](https://img.shields.io/github/license/mattkrins/bitwarden-to-keepass)

Export your [bitwarden](https://bitwarden.com/) or [vaultwarden](https://github.com/dani-garcia/vaultwarden) credentials vault to a [KeePass](https://keepass.info/) kdbx file.


Folder structure is replicated.\
As bitwarden supports multiple URLs and keepass/keepassxc does not, URL 1 is used.\
Notes are added and appended to the note is a JSON string containing the rest of the entry.

Uses [@bitwarden/cli](https://bitwarden.com/help/cli/) to export the vault and [keepassxc](https://github.com/keepassxreboot/keepassxc/blob/develop/docs/man/keepassxc-cli.1.adoc) to generate the kdbx file.

## Environment variables
- KP_PATH="/export/vault.kdbx"\
Path where the .kdbx will be saved to.
- BW_SERVER="https://vault.bitwarden.eu" \
[Target server](https://bitwarden.com/help/change-client-environment/#cli)\
URL of the warden instance to connect to.
- BW_CLIENTID=""\
[API key client](https://bitwarden.com/help/personal-api-key/)\
Used to [login](https://bitwarden.com/help/directory-sync-cli/#login) to the target server.
- BW_CLIENTSECRET=""\
[API key secret](https://bitwarden.com/help/personal-api-key/)\
Used to [login](https://bitwarden.com/help/directory-sync-cli/#login) to the target server.
- BW_PASSWORD=""\
[Master password](https://bitwarden.com/help/master-password/)\
Used to [unlock](https://bitwarden.com/help/unlock-with-pin/#unlocking) the vault.
