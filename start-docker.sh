#docker build --tag polkadotms-image:0.0 .
docker run --rm -dit --name polkadotms --net=host polkadotms-image:0.0

