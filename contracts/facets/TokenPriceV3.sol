//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import { LibDiamond } from "../libraries/LibDiamond.sol";


/**
 * @title TokenPriceV3
 * @author Jey
 * @dev This contract handles the token prices each day.
 *      setPrice functions is upgraded with set today's price feature
 */
contract TokenPriceV3 is Pausable{
    
    /// token price struct
    /// @param tokenPrice - the price of token
    /// @param isValid - when the day of price is set, it is flagged to true
    struct TokenPriceStruct {
      uint tokenPrice;
      bool isValid;
    }

    /// tokenPrices mapping data
    /// int32 - the count of days from 1970-01-01
    /// i.e 
    /// 1970.01.01 is 0
    /// 1971.01.01 is 365
    /// 2022.01.01 is 18993
    mapping (int32 => TokenPriceStruct) public tokenPrices;
    
    /// offset for from 1970-01-01
    int private constant OFFSET19700101 = 2440588;
    
    event SetTokenPrice(int32 _days, uint price);

    /**
    * @dev Set today's token price with only owner available (Version 3)
    * @param _price price of token
    */
    function setPrice(uint _price) external whenNotPaused {

      LibDiamond.enforceIsContractOwner();
      
      int32 _days = int32(int256(block.timestamp / 24 / 60 / 60));

      tokenPrices[_days].tokenPrice = _price;
      tokenPrices[_days].isValid = true;

      emit SetTokenPrice(_days, _price);
    }
}
