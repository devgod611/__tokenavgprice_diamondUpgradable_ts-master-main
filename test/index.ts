import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const {
  getSelectors,
  FacetCutAction,
} = require("../scripts/libraries/diamond.js");
const { deployDiamond } = require("../scripts/deploy.ts");

describe("Token Price (Typescript/Diamond Standard/Hardhat) Test\n", async () => {
  let diamondAddress: string;
  let diamondCutFacet: Contract;
  let diamondLoupeFacet: Contract;
  let tokenPriceV1: Contract;
  let tokenPriceV2: Contract;
  let tokenPriceV3: Contract;
  let receipt;
  let tx;
  const addresses = [];
  let owner: SignerWithAddress, addr1: SignerWithAddress;
  const price1 = BigNumber.from("1000000000000000000");
  const price2 = BigNumber.from("2000000000000000000");
  const price3 = BigNumber.from("1500000000000000000");

  before(async () => {
    /// Deploy - DiamondCutFacet, Diamond, DiamondInit, DiamondLoupeFacet, TokenPriceV1
    diamondAddress = await deployDiamond();

    diamondCutFacet = await ethers.getContractAt(
      "DiamondCutFacet",
      diamondAddress
    );
    diamondLoupeFacet = await ethers.getContractAt(
      "DiamondLoupeFacet",
      diamondAddress
    );
    tokenPriceV1 = await ethers.getContractAt("TokenPriceV1", diamondAddress);
    [owner, addr1] = await ethers.getSigners();
  });

  describe("Token Price Version 1 test", async () => {
    describe("Diamond standard test", async () => {
      it("Should four facets deployed (DiamondCutFacet, DiamondInit, DiamondLoupeFacet, TokenPriceV1)", async () => {
        for (const address of await diamondLoupeFacet.facetAddresses()) {
          addresses.push(address as never);
        }
        expect(addresses.length).to.be.equal(4);
      });
    });

    describe("Pausable test", async () => {
      it("Should owner pause the contract", async () => {
        await expect(tokenPriceV1.pause()).to.emit(tokenPriceV1, "Paused");
      });

      it("Should owner unpause the paused contract", async () => {
        await expect(tokenPriceV1.unpause()).to.emit(tokenPriceV1, "Unpaused");
      });

      it("Shouldn't owner pause contract that not have been paused.", async () => {
        await tokenPriceV1.pause();
        await expect(tokenPriceV1.pause()).to.be.revertedWith(
          "Pausable: paused"
        );
      });

      it("Shouldn't owner unpause contract that have already been unpaused.", async () => {
        await tokenPriceV1.unpause();
        await expect(tokenPriceV1.unpause()).to.be.revertedWith(
          "Pausable: not paused"
        );
      });

      it("Should only owner pause the contract", async () => {
        await expect(tokenPriceV1.connect(addr1).pause()).to.be.revertedWith(
          "LibDiamond: Must be contract owner"
        );
      });

      it("Should only owner unpause the contract", async () => {
        tokenPriceV1.pause();
        await expect(tokenPriceV1.connect(addr1).unpause()).to.be.revertedWith(
          "LibDiamond: Must be contract owner"
        );
      });

      it("Should calling function reverted when paused", async () => {
        await expect(
          tokenPriceV1.setPrice(price1, 2022, 1, 1)
        ).to.be.revertedWith("Pausable: paused");
      });
    });

    describe("Handle token price test", async () => {
      it("Shouldn't get average price if there isn't any token prices in range", async () => {
        await tokenPriceV1.unpause();
        await expect(
          tokenPriceV1.getAvgTokenPrice(2022, 1, 2022, 2)
        ).to.be.revertedWith("no prices set");
      });

      it("Should owner set token price", async () => {
        // set token price on 2022-01-01
        await expect(tokenPriceV1.setPrice(price1, 2022, 1, 1)).to.emit(
          tokenPriceV1,
          "SetTokenPrice"
        );
      });

      it("Should general account set token price", async () => {
        // set token price on 2022-02-15
        expect(
          await tokenPriceV1.connect(addr1).setPrice(price2, 2022, 2, 15)
        ).to.emit(tokenPriceV1, "SetTokenPrice");
      });

      it("Should get token price", async () => {
        expect(await tokenPriceV1.getPrice(2022, 1, 1)).to.equal(price1);
      });

      it("Should calculate average token price", async () => {
        // get average token price from Jan 2022 to Feb 2022
        expect(await tokenPriceV1.getAvgTokenPrice(2022, 1, 2022, 2)).to.equal(
          price1.add(price2).div(2)
        );
      });

      it("Should date parameter of setPrice function after 1970-01-01", async () => {
        // set token price on 1960-01-01
        await expect(
          tokenPriceV1.setPrice(price1, 1960, 1, 1)
        ).to.be.revertedWith("date should be after 1970-01-01");
      });

      it("Shouldn't get token price on unset day", async () => {
        await expect(tokenPriceV1.getPrice(2021, 1, 1)).to.be.revertedWith(
          "price not set on this day"
        );
      });

      it("Should get average price transaction reverted if End date earlier than Start date", async () => {
        await tokenPriceV1.setPrice(price1, 2022, 1, 1); // 2022-01-01    -   token price 1 ether
        await tokenPriceV1.setPrice(price2, 2022, 2, 15); // 2022-02-15   -   token price 2 ether
        await expect(
          tokenPriceV1.getAvgTokenPrice(2022, 1, 2021, 12)
        ).to.be.revertedWith("start date later than end");
      });
    });
  });

  describe("Token Price Version 2 test", async () => {
    it("Shouldn't general account upgrade to Version 2", async () => {
      const TokenPriceV2 = await ethers.getContractFactory("TokenPriceV2");
      tokenPriceV2 = await TokenPriceV2.deploy();
      await tokenPriceV2.deployed();

      const selectors = getSelectors(TokenPriceV2).get([
        "setPrice(uint, int, int, int)",
      ]);
      await expect(
        diamondCutFacet.connect(addr1).diamondCut(
          [
            {
              facetAddress: tokenPriceV2.address,
              action: FacetCutAction.Replace,
              functionSelectors: selectors,
            },
          ],
          ethers.constants.AddressZero,
          "0x",
          { gasLimit: 800000 }
        )
      ).to.be.revertedWith("LibDiamond: Must be contract owner");
    });

    it("Should owner upgrade to Version 2 - replace setPrice with onlyOwner function", async () => {
      const TokenPriceV2 = await ethers.getContractFactory("TokenPriceV2");
      tokenPriceV2 = await TokenPriceV2.deploy();
      await tokenPriceV2.deployed();

      const selectors = getSelectors(TokenPriceV2).get([
        "setPrice(uint, int, int, int)",
      ]);
      tx = await diamondCutFacet.diamondCut(
        [
          {
            facetAddress: tokenPriceV2.address,
            action: FacetCutAction.Replace,
            functionSelectors: selectors,
          },
        ],
        ethers.constants.AddressZero,
        "0x",
        { gasLimit: 800000 }
      );
      receipt = await tx.wait();
      if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`);
      }
    });

    it("Should storage variable values remain", async () => {
      // get average token price from Jan 2022 to Feb 2022
      expect(await tokenPriceV1.getAvgTokenPrice(2022, 1, 2022, 2)).to.equal(
        price1.add(price2).div(2)
      );
    });

    it("Shouldn't general account set token price on Version 2", async () => {
      // set token price on 2022-01-01
      await expect(
        tokenPriceV1.connect(addr1).setPrice(price1, 2022, 1, 1)
      ).to.be.revertedWith("LibDiamond: Must be contract owner");
    });

    it("Should owner set token price on Version 2", async () => {
      // set token price on 2021-12-25
      await expect(tokenPriceV1.setPrice(price3, 2021, 12, 25)).to.emit(
        tokenPriceV1,
        "SetTokenPrice"
      );
    });
  });

  describe("Token Price Version 3 test", async () => {
    it("Should upgrade to Version 3 - add new setTodayPrice function", async () => {
      const TokenPriceV3 = await ethers.getContractFactory("TokenPriceV3");
      tokenPriceV3 = await TokenPriceV3.deploy();
      await tokenPriceV3.deployed();

      const selectors = getSelectors(TokenPriceV3).get(["setPrice(uint)"]);
      tx = await diamondCutFacet.diamondCut(
        [
          {
            facetAddress: tokenPriceV3.address,
            action: FacetCutAction.Add,
            functionSelectors: selectors,
          },
        ],
        ethers.constants.AddressZero,
        "0x",
        { gasLimit: 800000 }
      );
      receipt = await tx.wait();
      if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`);
      }
    });

    it("Should owner set today's token price", async () => {
      tokenPriceV3 = await ethers.getContractAt("TokenPriceV3", diamondAddress);
      // Set todays's token price
      await tokenPriceV3.setPrice(price3);
    });

    it("Should owner get today's token price", async () => {
      // Get current date
      const today = new Date();
      const dd = today.getDate();
      const mm = today.getMonth() + 1;
      const yyyy = today.getFullYear();

      tokenPriceV3 = await ethers.getContractAt("TokenPriceV3", diamondAddress);
      // Set todays's token price
      expect(await tokenPriceV1.getPrice(yyyy, mm, dd)).to.equal(price3);
    });
  });
});
