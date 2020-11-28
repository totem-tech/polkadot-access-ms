# init submodules if not already done
#git submodule init
# update submodules recursively
#git submodule update --recursive --remote

PORT="int: default=3004" \
CertPath="string: default=./sslcert/fullchain.pem" \
KeyPath="string: default=./sslcert/privkey.pem" \
__________OPTIONAL_________="for automated bug alerts to Discord using webhook" \
DISCORD_WEBHOOK_USERNAME="string: a name for the hook" \
DISCORD_WEBHOOK_URL="string: webhook URL" \
DISCORD_WEBHOOK_AVATAR_URL="string: URL of hook avatar image" \
yarn run dev