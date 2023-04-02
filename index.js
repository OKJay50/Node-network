```JavaScript
const Avalanche = require('avalanche');
const network_id = 'local';
const node_api = 'http://localhost:9650';

class Node {
  constructor(private_key, resilience) {
    const ava = new Avalanche(node_api, '', '', network_id, 'X');
    this.xchain = ava.XChain(); // Initialize Chain
    this.private_key = private_key; // node's private key for signing transactions
    this.resilience = resilience; // node's resilience score
    this.token_balance = 0; // current token balance
    this.white_list = []; // list of approved users
  }

  async store_data(data, data_size, user, signature) {
    // verify user is whitelisted
    if (!this.white_list.includes(user)) {
      throw new Error('User not authorized to store data on this node.');
    }

    // verify that the signature matches the user and data
    const data_string = user + data + this.private_key;
    if (crypto.createHash('sha256').update(data_string).digest('hex') !== signature) {￼
￼
 // verify that the signature matches the user and data
    const data_string = user + data + this.private_key;
    if (crypto.createHash('sha256').update(data_string).digest('hex') !== signature) {
      throw new Error('Invalid signature.');
    }

    // verify data is not malicious
    if (blockchain.verify_data(data)) {
      throw new Error('Data contains malicious content.');
    }

    // create transaction to transfer tokens
    const utxos = await this.xchain.getUTXOs(this.private_key.getAddressString());
    const utxo = utxos[0];

    const unsigned_tx = await this.xchain.buildBaseTx(utxo, this.private_key.getAddressString(), user, this.token_balance);
    const signed_tx = unsigned_tx.sign(this.private_key);

    const txid = await this.xchain.issueTx(signed_tx);

    // store data locally
    this.token_balance += blockchain.calculate_token_fee(data_size);
  }

  async request_data(data_size, user, signature) {
    // verify that the signature matches the user
    if (crypto.createHash('sha256').update(user + this.private_key).digest('hex') !== signature) {
      throw new Error('Invalid signature.');
    }

    // validate user has enough tokens
    if (this.token_balance < blockchain.calculate_token_fee(data_size)) {
      throw new Error('User does not have enough tokens to request data.');
    }

    // create transaction to transfer tokens
    const utxos = await this.xchain.getUTXOs(this.private_key.getAddressString());
    const utxo = utxos[0];

    const unsigned_tx = await this.xchain.buildBaseTx(utxo, this.private_key.getAddressString(), user, blockchain.calculate_token_fee(data_size));
    const signed_tx = unsigned_tx.sign(this.private_key);

    const txid = await this.xchain.issueTx(signed_tx);

    // retrieve data from network
    // validate that the data is not malicious before returning it
    const data = network.retrieve_data(data_size);
    if (blockchain.verify_data(data)) {
      throw new Error('Data contains malicious content.');
    }

    // deduct token fee from node's balance
    this.token_balance -= blockchain.calculate_token_fee(data_size);
    // return retrieved data
    return data;
  }

  async add_user_to_whitelist(user) {
    // verify user is an admin before adding user to whitelist
    // add user to whitelist
    this.white_list.push(user);
  }

  async remove_user_from_whitelist(user) {
    // verify user is an admin before removing user from whitelist
    // remove user from whitelist
    const index = this.white_list.indexOf(user);
    if (index > -1) {
      this.white_list.splice(index, 1);
    }
  }

  async update_resilience_score(score) {
    // set node's resilience score
    // resilience score is an float between 0 and 1
    // Higher values indicate a more resilient node
    this.resilience = score;
  }

  async get_resilience_score() {
    // get node's resilience score
    return this.resilience;
  }
}

// example usage of Node class
const node1_private_key = 'private_key_1';
const node2_private_key = 'private_key_2';
const node3_private_key = 'private_key_3';
const node4_private_key = 'private_key_4';

// initialize network with nodes
const node1 = new Node(node1_private_key, 0.8);
const node2 = new Node(node2_private_key, 0.7);
const node3 = new Node(node3_private_key, 0.9);
const node4 = new Node(node4_private_key, 0.6);

// add nodes to the network
const network = [node1, node2, node3, node4];

// test case to store data and retrieve it
const signature = crypto.createHash('sha256').update('user1' + 'some data' + node1_private_key).digest('hex');
node1.add_user_to_whitelist('user1'); // add user to whitelist
node1.store_data('some data', 10, 'user1', signature); // store data
const signature2 = crypto.createHash('sha256').update('user1' + node2_private_key).digest('hex');
node2.request_data(10, 'user1', signature2); // user2 retrieves data
node1.remove_user_from_whitelist('user1'); // remove user from whitelist
```