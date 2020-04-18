const GTSGMock = artifacts.require('GTSGWithBalance.sol');
const Proxy = artifacts.require('AdminUpgradeabilityProxy.sol');

const assertRevert = require('./helpers/assertRevert');

// Test that the GTSG contract can reclaim GTSG it has received.
// Note that the contract is not payable in Eth.
contract('CanReclaimFunds', function ([_, admin, owner, assetProtectionRole, anyone]) {
  const amount = 100;

  beforeEach(async function () {
    // Create contract and token
    const gtsg = await GTSGMock.new({from: owner});
    const proxy = await Proxy.new(gtsg.address, {from: admin});
    const proxiedGTSG = await GTSGMock.at(proxy.address);
    await proxiedGTSG.initialize({from: owner});
    await proxiedGTSG.initializeBalance(owner, amount);
    this.token = proxiedGTSG;

    // Send token to the contract
    await this.token.transfer(this.token.address, amount, {from: owner});
    const balance = await this.token.balanceOf(owner);
    assert.equal(0, balance.toNumber());
    const contractBalance = await this.token.balanceOf(this.token.address);
    assert.equal(amount, contractBalance);

    // freeze the contract address to mimick the current state on mainnet
    await this.token.setAssetProtectionRole(assetProtectionRole, {from: owner});
    await this.token.freeze(this.token.address, {from: assetProtectionRole});
  });

  it('should not accept Eth', async function () {
    await assertRevert(
      web3.eth.sendTransaction({from: owner, to: this.token.address, value: amount})
    );
  });

  it('should allow owner to reclaim tokens', async function () {
    await this.token.reclaimGTSG({from: owner});

    const balance = await this.token.balanceOf(owner);
    assert.equal(amount, balance);
    const contractBalance = await this.token.balanceOf(this.token.address);
    assert.equal(0, contractBalance);
  });

  it('should allow only owner to reclaim tokens', async function () {
    await assertRevert(
      this.token.reclaimGTSG({from: anyone})
    );
  });
});
