const Avalanche = require('avalanche');
const network_id = 'local';
const node_api = 'http://localhost:9650';

class Node {
  constructor(private_key, resilience) {
    const ava = new Avalanche(node_api, '', '', network_id, 'X');
    this.xchain = ava.XChain();
    this.private_key = private_key;
    this.resilience = resilience;
    this.token_balance = 0;
    this.white_list = [];
  }

  async store_data(data, data_size, user, signature) {
    if (!this.white_list.includes(user)) {
      throw new Error('User not authorized to store data on this node.');
    }

    const data_string = user + data + this.private_key;
    if (crypto.createHash('sha256').update(data_string).digest('hex') !== signature) {
      throw new Error('Invalid signature.');
    }

    if (blockchain.verify_data(data)) {
      throw new Error('Data contains malicious content.');
    }

    const utxos = await this.xchain.getUTXOs(this.private_key.getAddressString());
    const utxo = utxos[0];

    const unsigned_tx = await this.xchain.buildBaseTx(utxo, this.private_key.getAddressString(), user, this.token_balance);
    const signed_tx = unsigned_tx.sign(this.private_key);

    const txid = await this.xchain.issueTx(signed_tx);

    this.token_balance += blockchain.calculate_token_fee(data_size);
  }

  async request_data(data_size, user, signature) {
    if (crypto.createHash('sha256').update(user + this.private_key).digest('hex') !== signature) {
      throw new Error('Invalid signature.');
    }

    if (this.token_balance < blockchain.calculate_token_fee(data_size)) {
      throw new Error('User does not have enough tokens to request data.');
    }

    const utxos = await this.xchain.getUTXOs(this.private_key.getAddressString());
    const utxo = utxos[0];

    const unsigned_tx = await this.xchain.buildBaseTx(utxo, this.private_key.getAddressString(), user, blockchain.calculate_token_fee(data_size));
    const signed_tx = unsigned_tx.sign(this.private_key);

    const txid = await this.xchain.issueTx(signed_tx);

    const data = network.retrieve_data(data_size);
    if (blockchain.verify_data(data)) {
      throw new Error('Data contains malicious content.');
    }

    this.token_balance -= blockchain.calculate_token_fee(data_size);
    return data;
  }

  async add_user_to_whitelist(user) {
    this.white_list.push(user);
  }

  async remove_user_from_whitelist(user) {
    const index = this.white_list.indexOf(user);
    if (index > -1) {
      this.white_list.splice(index, 1);
    }
  }

  async update_resilience_score(score) {
    this.resilience = score;
  }

  async get_resilience_score() {
    return this.resilience;
  }
}

const node1_private_key = 'private_key_1';
const node2_private_key = 'private_key_2';
const node3_private_key = 'private_key_3';
const node4_private_key = 'private_key_4';

const node1 = new Node(node1_private_key, 0.8);
const node2 = new Node(node2_private_key, 0.7);
const node3 = new Node(node3_private_key, 0.9);
const node4 = new Node(node4_private_key, 0.6);

const network = [node1, node2, node3, node4];

const signature = crypto.createHash('sha256').update('user1' + 'some data' + node1_private_key).digest('hex');
node1.add_user_to_whitelist('user1');
node1.store_data('some data', 10, 'user1', signature);
const signature2 = crypto.createHash('sha256').update('user1' + node2_private_key).digest('hex');
node2.request_data(10, 'user1', signature2);
node1.remove_user_from_whitelist('user1');