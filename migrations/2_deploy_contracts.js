const PAXG = artifacts.require('GTSGImplementation');
const Proxy = artifacts.require('AdminUpgradeabilityProxy');

module.exports = async function(deployer) {
  await deployer;

  await deployer.deploy(GTSG);
  const proxy = await deployer.deploy(Proxy, GTSG.address);
  const proxiedPAXG = await PAXG.at(proxy.address);
  await proxy.changeAdmin("<Add Admin wallet address>");
  await proxiedGTSG.initialize();
};
