use dep::std;
use dep::ecrecover;


fn main(
    pub_key: [u8; 64],
    signature: [u8; 64],
    hashed_message: pub [u8; 32]
) -> pub Field {
    let key = ecrecover::secp256k1::PubKey::from_unified(pub_key);
    let address = ecrecover::ecrecover(key.pub_x, key.pub_y, signature, hashed_message);

    address  
}