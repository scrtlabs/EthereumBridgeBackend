USERNAME="$1"
PASSWORD="$2"
SRC_DB="$3"
DST_DB_BRIDGE="$4"
DST_DB_UI="$5"
DST_DB_SWAP="$6"

#for COLLECTION in commands swap eth_signatures signer_health signatures swap_tracker_object token_pairing scrt_retry
#do
#	mongodump --uri mongodb+srv://$USERNAME:$PASSWORD@cluster0.dka2m.mongodb.net/$SRC_DB --collection $COLLECTION --out $COLLECTION-bsc.out --forceTableScan
#	mongorestore --uri mongodb+srv://$USERNAME:$PASSWORD@bridge-testnet.ekhng.mongodb.net/$DST_DB_BRIDGE --db $DST_DB_BRIDGE --collection $COLLECTION $COLLECTION-bsc.out/$SRC_DB/$COLLECTION.bson
#done

#for COLLECTION in operations token_pairing
#do
#	mongodump --uri mongodb+srv://$USERNAME:$PASSWORD@cluster0.dka2m.mongodb.net/$SRC_DB --collection $COLLECTION --out $COLLECTION-bsc.out --forceTableScan
#	mongorestore --uri mongodb+srv://$USERNAME:$PASSWORD@bridge-testnet.ekhng.mongodb.net/$DDST_DB_UI --db $DST_DB_UI --collection $COLLECTION $COLLECTION-bsc.out/$SRC_DB/$COLLECTION.bson
#done
#
for COLLECTION in token_pairing # secret_tokens airdrop_merkle airdrop_merkle_secret cashback_stats rewards_data secret_tokens secret_votes secretswap_pairs secretswap_pools
do
	mongodump --uri mongodb+srv://$USERNAME:$PASSWORD@cluster0.dka2m.mongodb.net/$SRC_DB --collection $COLLECTION --out $COLLECTION-bsc.out --forceTableScan
	mongorestore --uri mongodb+srv://$USERNAME:$PASSWORD@bridge-testnet.ekhng.mongodb.net/$DST_DB_SWAP --db $DST_DB_SWAP --collection $COLLECTION $COLLECTION-bsc.out/$SRC_DB/$COLLECTION.bson
done