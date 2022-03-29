//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import { LibDiamond } from "../libraries/LibDiamond.sol";

/**
 * @title TokenPriceV1
 * @author Jey
 * @dev This contract handles the token prices each day.
 */
contract TokenPriceV1 is Pausable{
    
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

    modifier isValidDate(int year) {
        require(year >= 1970, "date should be after 1970-01-01");
        _;
    }
    function pause() public {
        LibDiamond.enforceIsContractOwner();
        _pause();
    }

    function unpause() public {
        LibDiamond.enforceIsContractOwner();
        _unpause();
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
    * @dev Set token price
    * @param _price price of token
    * @param _year date (year)
    * @param _month date (month)
    * @param _day date (day)
    */
    function setPrice(uint _price, int _year, int _month, int _day) external whenNotPaused isValidDate(_year) {
      /// calculate the count of days from 1970-01-01
      int32 _days = daysFromDate(_year, _month, _day);

      tokenPrices[_days].tokenPrice = _price;
      tokenPrices[_days].isValid = true;

      emit SetTokenPrice(_days, _price);
    }

    /**
    * @dev Get token price
    * @param _year date (year)
    * @param _month date (month)
    * @param _day date (day)
    */
    function getPrice(int _year, int _month, int _day) external whenNotPaused isValidDate(_year) view returns (uint) {
      int32 _days = daysFromDate(_year, _month, _day);
      require(tokenPrices[_days].isValid, "price not set on this day");
      return tokenPrices[_days].tokenPrice;
    }

    /**
    * @dev Calculate average token price
    * @param _fromYear start year of the period
    * @param _fromMonth start month of the period
    * @param _toYear end year of the period
    * @param _toMonth end month of the period
    */
    function getAvgTokenPrice(int16 _fromYear, int8 _fromMonth, int16 _toYear, int8 _toMonth) external whenNotPaused isValidDate(_fromYear) view returns (uint) {

      int32 _toDays;

      /// _toDays is set to the 1st day of the next month
      /// i.e if the _toYear is 2022 and _toMonth is 3(Mar), the _toDays indicate the day of 2022-04-01
      /// if the _toYear is 2021 and _toMonth is 12(Dec), the _toDays indicate the day of 2022-01-01
      if (_toMonth > 12) {
        _toDays = daysFromDate(_toYear + 1, _toMonth % 12, 1);
      }
      else {
        _toDays = daysFromDate(_toYear, _toMonth + 1, 1);
      }
      int32 _fromDays = daysFromDate(_fromYear, _fromMonth, 1);
      
      require (_fromDays < _toDays, "start date later than end");
      uint16 _tokenPriceCount = 0;
      uint _tokenPriceSum = 0;

      for (int32 i = _fromDays; i < _toDays; i++) {
        /// collect token prices for which isValid = true
        if (tokenPrices[i].isValid) {
          _tokenPriceSum += tokenPrices[i].tokenPrice;
          _tokenPriceCount ++;
        }
      }

      require (_tokenPriceCount > 0, "no prices set");

      return _tokenPriceSum / _tokenPriceCount;
    }
}
