use dep::std;
use dep::ecrecover;


fn main(
    nft_id: u8,
    round_number: u8,
    pub_key: [u8; 64],
    signature: [u8; 64],
    hashed_message: pub [u8; 32]
) {
    let key = ecrecover::secp256k1::PubKey::from_unified(pub_key);
    let address = key.to_eth_address();
    let message = [nft_id, round_number, address as u8];
    let hash = std::hash::keccak256(message, 2);
    assert(hash == hashed_message);

    let is_valid = key.verify_sig(signature, hashed_message);
    assert(is_valid);
}