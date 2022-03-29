//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import { LibDiamond } from "../libraries/LibDiamond.sol";

/**
 * @title TokenPriceV2
 * @author Jey
 * @dev This contract handles the token prices each day.
 *      setTokenPrice functions is upgraded with only owner available
 */
contract TokenPriceV2 is Pausable{
    
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

    /// check the date is after 1970-01-01
    modifier isValidDate(int year) {
        require(year >= 1970, "date should be after 1970-01-01");
        _;
    }

    /// Calculate the count of days from 1970-01-01   
    function daysFromDate(int year, int month, int day) private pure isValidDate(year) returns (int32 _days) {
      int _year = int(year);
      int _month = int(month);
      int _day = int(day);

      int __days = _day 
        - 32075
        + 1461 * (_year + 4800 + (_month - 14) / 12) / 4
        + 367 * (_month - 2 - (_month - 14) / 12 * 12) / 12
        - 3 * ((_year + 4900 + (_month - 14) / 12) / 100) / 4
        - OFFSET19700101;

      _days = int32(__days);
    }

    /**
    * @dev Set token price with only owner available (Version 2)
    * @param __price price of token
    * @param _year date (year)
    * @param _month date (month)
    * @param _day date (day)
    */
    function setPrice(uint __price, int _year, int _month, int _day) external whenNotPaused isValidDate(_year) {

      LibDiamond.enforceIsContractOwner();
      /// calculate the count of days from 1970-01-01
      int32 _days = daysFromDate(_year, _month, _day);

      tokenPrices[_days].tokenPrice = __price;
      tokenPrices[_days].isValid = true;

      emit SetTokenPrice(_days, __price);
    }
}
