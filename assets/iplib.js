/*
 * IP functions library.
 *
 * 2020-08-06
 * 2020-08-21 fix the bug when a range ending address could be lesser than starting,
 *            in getPrefixBitsNumber().
 * 2020-08-24 fix the getRanges() algorithm, make it recursive.
 * 2020-08-26 getRanges() fixed,
 *            xorBytes() - parameter n added, getRange() added,
 *            Subnet typedef added.
 * 
 * Tests in https://github.com/eakondratiev/Projects/tree/master/js-tests
 */
/**
 * @preserve In public domain since 2019-09-07.
 */
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name iplib.min.js
// ==/ClosureCompiler==

/* jshint esversion: 6 */

/**
 * The namespace for the IPlib functions.
 */
(function (IPlib, undefined) {
  'use strict';

  var ERR_MASK_OK = 0,
    ERR_MASK_WRONG = 1,
    ERR_MASK_COMPLEX = 2;

  /**
   * Represented the IP subnet.
   * @typedef {Object} IpSubnet
   * @property {[Number]} from The first address of the subnet also the subnet prefix, array of octets.
   * @property {[Number]} to The last address of the subnet, array of octets.
   * @property {[Number]} mask The mask of the subnet, array of octets.
   * @property {Number} prefixBits The number of leading 1 bits in the mask.
   */

  /* Public constants */
  IPlib.ERR_MASK_OK = ERR_MASK_OK;
  IPlib.ERR_MASK_WRONG = ERR_MASK_WRONG;
  IPlib.ERR_MASK_COMPLEX = ERR_MASK_COMPLEX;

  /* Public functions */
  IPlib.getRanges = getRanges;
  IPlib.getRange = getRange;
  IPlib.getIp4ByteArray = getIp4ByteArray;
  IPlib.getMask = xorBytes;
  IPlib.getPrefixBitsNumber = getPrefixBitsNumber;
  IPlib.compareIpAddresses = compareIpAddresses;
  IPlib.getMaskFromPrefixBits = getMaskFromPrefixBits;
  IPlib.getNextIp = getNextIp;
  IPlib.isIPv4 = isIPv4;
  IPlib.isIPv6 = isIPv6;

  /**
   * Returns the array of ranges found in the specified range.
   * Returns null if the range cannot be found or ip1, ip2 are wrong data.
   * @param {[Number]} ip1 The array of the first address octets.
   * @param {[Number]} ip2 The array of the second address octets.
   * @param {[*]} ranges The array of previously found ranges, optional.
   * @returns {[IpSubnet]} Array of subnets.
   */
  function getRanges(ip1, ip2, ranges) {

    var mask,
      prefixBits,
      rangeFrom,
      rangeTo,
      range,
      bitsAddition = 0;

    /* Validate */
    if (!isIPv4(ip1) || !isIPv4(ip2)) {
      return null;
    }

    if (ranges === undefined) {
      // initialize the result array
      ranges = [];
    }

    if (ranges.length > 32) {
      // the array is too long
      return ranges;
    }

    switch (compareIpAddresses(ip1, ip2)) {
      case 1:
        // ip2 precedes ip1
        return null;

      case 0:
        // equal, same address
        ranges.push ({
          from: ip1,
          to: ip2,
          mask: [255, 255, 255, 255],
          prefixBits: 32
        });

        return ranges;

      case -1:
        // ip1 precedes ip2, find ranges
        // The range can contains sub ranges.
        // Try to get the first range as the whole range.
        rangeFrom = ip1;
        rangeTo = ip2;
        mask = xorBytes(rangeFrom, rangeTo);
        prefixBits = getPrefixBitsNumber(mask);
        
        switch (prefixBits.error) {
          case ERR_MASK_OK:
            // full range
            // create the range object and add to result
            ranges.push({
              from: rangeFrom, // also the host
              to: rangeTo,
              mask: mask,
              prefixBits: prefixBits.bits
            });
            return ranges;
            
          case ERR_MASK_COMPLEX:
            // find sub-ranges
            // recursive call

            // The higher value means lesser subnet.
            // 1. Start from the subnet lesser than counted number of bits
            //    and from the range start.
            do {

              // try smaller subnet
              bitsAddition += 1;

              mask = getMaskFromPrefixBits(prefixBits.bits + bitsAddition);

              // The first address for the mask can be smaller than IPfrom,
              // in this case make new loop with smaller network
              range = getRange (rangeFrom, mask);

              // Get last IP address by the mask.
              // lastIp = firstIp XOR mask XOR 255
              // NOTE: when the mask is wrong the rangeTo can be lesser than rangeFrom,
              // so check it in the loop condition nad do it while the right mask will be found.
              rangeTo = xorBytes(rangeFrom, mask);

            }
            while (prefixBits.bits + bitsAddition <= 32 &&
                   (compareIpAddresses (range.from, rangeFrom) < 0 ||
                    compareIpAddresses (rangeFrom, rangeTo) > 0));
                   // keep searching appropriate network (do the loop while):
                   // prefix bits smaller than 32
                   // AND (real from < range from OR range from < range to)

            if (compareIpAddresses (rangeFrom, rangeTo) <= 0) {
              
              // create the range object and add to result
              ranges.push({
                from: rangeFrom, // also the host
                to: rangeTo,
                mask: mask,
                prefixBits: prefixBits.bits + bitsAddition
              });

              // 2. recursively try next subnet from rangeTo + 1 to ip2 (tail).
              getRanges (getNextIp(rangeTo), ip2, ranges);

            }

            break;

        }

        break;

    }

    return ranges;

  }

  /**
   * Returns the value indicating whether the IP is IPv4 address.
   * @param {[Number]} ip Array of bytes (octets). 4 groups of 8 bits each.
   */
  function isIPv4(ip) {
    return isIpAddress(ip, 4, 255);
  }

  /**
   * Returns the value indicating whether the IP is IPv6 address.
   * @param {[Number]} ip Array of numbers (groups). 8 groups of 16 bits each.
   */
  function isIPv6(ip) {
    return isIpAddress(ip, 8, 65536);
  }

  /**
   * Private function.
   * Returns the value indicating whether the IP is an array of bytes of specified length.
   * @param {[Number]} ip Array of bytes.
   * @param {Number} groups The number of groups in the address.
   * @param {Number} max The maximum value in the group.
   */
  function isIpAddress(ip, groups, max) {

    var i;

    if (typeof ip !== 'object' || ip === null) {
      return false;
    }

    if (ip.length !== groups) {
      return false;
    }

    for (i = 0; i < ip.length; i++) {
      if (ip[i] < 0 || ip[i] > max) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parses the string and returns the array of bytes representing the IP v4 address.
   * Returns null if the string is not IP v4 address.
   * @param {String} ip The string representation of the IP v4 address.
   * @returns {[Number]} array of four numbers,
   * array[0] is least significant octet, array[3] is most significant.
   */
  function getIp4ByteArray(ip) {

    var result = [],
      reOctets = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
      m = reOctets.exec(ip);

    if (m === null) {
      return null;
    }

    // explicit number of octets in the Regex.
    for (var i = 1; i < 5; i++) {

      var octet = parseInt(m[i], 10);

      if (octet < 0 || octet > 255) {
        return null;
      }

      result.push(octet);

    }

    return result;

  }

  /**
   * Returns the array with the IP subnet mask bytes.
   * Returns null if ip1 or ip2 is null or length of the arrays is not equal.
   * @param {[Number]} ip1 The first IP octets.
   * @param {[Number]} ip2 The second IP octets.
   * @param {Number} n The number applied as the third XOR operand. Optional, default is 255.
   */
  function xorBytes(ip1, ip2, n) {

    var mask = [],
      octet;

    if (ip1 === null ||
        ip2 === null ||
        ip1.length !== ip2.length) {

      return null;
    }

    if (n === undefined) { n = 255; }

    for (var i = 0; i < ip1.length; i++) {

      octet = (ip1[i] ^ ip2[i]) ^ n; // bitwise XOR
      mask.push(octet);

    }

    return mask;
  }

  /**
   * Returns the structure with the number of bits in the range prefix (ones in the mask) and indicator of an error.
   * Returns .bits = -1 if the mask array contains wrong bits (after ones only zeros are possible).
   * @param {[Number]} mask Array of octets (groups).
   * @returns {{bits: Number, error: Number}}} .bits - the number of sequential ones, .error - the error code.
   */
  function getPrefixBitsNumber (mask) {

    var ones = 0,
      previuosBit = 255,
      bit,
      byte,
      i,
      j;

    if (mask === null) {
      return { bits: -1, error: ERR_MASK_WRONG };
    }

    // Move from the most to the least significant bits (left to right)
    // so after ones only zeros are possible in the mask.
    // 111...10..0000

    // four bytes: 0.1.2.3, from left to right
    for (i = 0; i <= 3; i++) {

      byte = mask[i];

      // bits from left to right: 01234567
      for (j = 7; j >= 0; j--) {

        bit = byte & 128; // 128 = 1000 0000

        if (bit > 0) {
          ones++;
        }

        if (bit > previuosBit) {
          // 1 to 0 - Ok, 0 to 1 - wrong
          // after zeroe(s) we got one, so the mask is wrong,
          // decrees counted one and exit.
          return { bits: ones - 1, error: ERR_MASK_COMPLEX };
        }

        byte = byte << 1; // shift bits to the left
        previuosBit = bit;
      }

    }

    return { bits: ones, error: ERR_MASK_OK };

  }

  /**
   * Compares two specified byte arrays and returns an integer that indicates their relative position in the sort order.
   * The two arrays must be of the same size.
   * @param {[Number]} ip1 The first IP address (four bytes array) to compare.
   * @param {[Number]} ip2 The second IP address (four bytes array) to compare.
   * @returns {Number} A signed number that indicates the relationship between the two comparands.
   * Value -1 means the ip1 precedes ip2 in the sort order.
   * Value  0 means the ip1 and ip2 are equal.
   * Value  1 means the ip1 follows ip2 in the sort order.
   * Returns NaN when ip1 or ip2 are not array of four numbers.
   */
  function compareIpAddresses(ip1, ip2) {

    var ARRAY_SIZE = 4,
      i;

    // validate
    if (ip1 === null || typeof ip1 !== 'object' ||
        ip2 === null || typeof ip2 !== 'object' ||
        ip1.length !== ip2.length) {

      return NaN;
    }

    /* Start from most significant number. */
    for (i = 0; i < ip1.length; i++) {

      if (ip1[i] < ip2[i]) { return -1; }
      if (ip1[i] > ip2[i]) { return 1; }
      // when equal compare less significant number, next loop.
    }

    // all elements are equal
    return 0;

  }

  /**
   * Returns array of four numbers (octets).
   * Returns [0, 0, 0, 0] when the number of bits not in the 0...32 range.
   * @param {Number} numberOfBits The number of leading 1 bits in the address prefix
   *                     (ones in the mask, suffix in the CIDR notation).
   * @returns {[Number]} Array of the mask octets.
   */
  function getMaskFromPrefixBits(numberOfBits) {

    var byte,
      bit,
      mask,
      bits = 0,
      result = [0, 0, 0, 0];

    if (numberOfBits <= 0 || numberOfBits > 32) {
      return result;
    }

    for (byte = 0; byte < result.length; byte++) {

      result[byte] = 0;
      mask = 128; // 128 = 1000 0000

      for (bit = 7; bit >= 0; bit--) {

        if (bits >= numberOfBits) {
          return result;
        }

        result[byte] |= mask; // byte = byte OR mask
        mask = mask >> 1; // right shift the mask bits for the next iteration
        ++bits;

      }
    }

    return result;
  }

  /**
   * Returns the next IP after the specified IP.
   * Returns null if the specified IP address is wrong or 255.255.255.255.
   * @param ip The four numbers array, IP octets.
   * @returns Four octets array.
   */
  function getNextIp(ip) {

    var MAX_VALUE = 255, // byte, 1111 1111.
      ADDITION = 1, /* from 0 to 255 */
      i,
      reminder = ADDITION,
      newOctetValue,
      newIp = [0, 0, 0, 0];

    if (ip === null ||
      ip.length !== 4) {

      return null;
    }

    /* from least significant to most significant octet. */
    for (i = ip.length - 1; i >= 0; i--) {

      newOctetValue = ip[i] + reminder;

      if (newOctetValue > MAX_VALUE) {
        // overflow 

        if (i === 0) {
          // overflow in most significant octet
          return null;
        }

        reminder = newOctetValue % MAX_VALUE;
        newOctetValue = 0;

      }
      else {
        reminder = 0;
      }

      newIp[i] = newOctetValue;

    }

    return newIp;

  }

  /**
   * Returns the range from the network prefix and mask.
   * Returns null if input values are wrong.
   * @param {[Number]} ip Array of the prefix octets.
   * @param {[Number]} mask Array of the mask octets.
   * @returns {{from: [Number], to: [Number]}} from and to IP addresses, each is an array of numbers.
   */
  function getRange (ip, mask) {

    var i,
      from;

    if (ip.length === undefined ||
        mask.length === undefined ||
        ip.length !== mask.length) {

      return null;
    }

    // calculate start address
    from = [];

    for (i = 0; i < ip.length; i++) {

      from.push (ip[i] & mask[i]);

    }

    // calculate the ending addres and return result
    return {
      from: from,
      to: xorBytes (ip, mask)
    };

  }

  //console.log ('*** DO TESTS ***');
  //IPlibTest ();

}(window.IPlib = window.IPlib || {}));


function IPlibTest () {

  var actual;

  actual = IPlib.getPrefixBitsNumber ([0,0,0,0]);
  assertAreEqual (0, actual.bits);

  actual = IPlib.getPrefixBitsNumber ([255,0,0,0]);
  assertAreEqual (8, actual.bits);

  actual = IPlib.getPrefixBitsNumber ([255,128,0,0]);
  assertAreEqual (9, actual.bits);
  
  actual = IPlib.getPrefixBitsNumber ([255,192,0,0]);
  assertAreEqual (10, actual.bits);
  
  actual = IPlib.getPrefixBitsNumber ([255,224,0,0]);
  assertAreEqual (11, actual.bits);
  
  actual = IPlib.getPrefixBitsNumber ([255,240,0,0]);
  assertAreEqual (12, actual.bits);
  
  actual = IPlib.getPrefixBitsNumber ([255,248,0,0]);
  assertAreEqual (13, actual.bits);
  
  actual = IPlib.getPrefixBitsNumber ([255,252,0,0]);
  assertAreEqual (14, actual.bits);
  
  actual = IPlib.getPrefixBitsNumber ([255,254,0,0]);
  assertAreEqual (15, actual.bits);
  
  actual = IPlib.getPrefixBitsNumber ([255,255,0,0]);
  assertAreEqual (16, actual.bits);

  actual = IPlib.getPrefixBitsNumber ([255, 225, 0, 0]); // wrong mask
  assertAreEqual (11, actual.bits);

  actual = IPlib.getPrefixBitsNumber ([0, 0, 0, 1]); // wrong mask
  assertAreEqual (0, actual.bits);

  // normal range
  actual = IPlib.getRanges ([192, 168, 0, 0], [192, 168, 0, 255]);
  assertAreEqual ([{
      from: [192, 168, 0, 0],
      to:   [192, 168, 0, 255],
      mask: [255, 255, 255, 0],
      prefixBits: 24
    }],
    actual);

  // complex range
  actual = IPlib.getRanges ([221, 0, 0, 0], [221, 3, 127, 255]);
  assertAreEqual ([{
      from: [221, 0, 0, 0],
      to:   [221, 1, 255, 255],
      mask: [255, 254, 0, 0],
      prefixBits: 15
    }, {
      from: [221, 2, 0, 0],
      to:   [221, 2, 255, 255],
      mask: [255, 255, 0, 0],
      prefixBits: 16
    }, {
      from: [221, 3, 0, 0],
      to:   [221, 3, 127, 255],
      mask: [255, 255, 128, 0],
      prefixBits: 17
    }],
    actual);

  // most complex range
  actual = IPlib.getRanges ([61, 140, 0, 0], [61, 146, 255, 255]);
  assertAreEqual ([{
      from: [61, 140, 0, 0],
      to:   [61, 143, 255, 255],
      mask: [255, 252, 0, 0],
      prefixBits: 14
    }, {
      from: [61, 144, 0, 0],
      to:   [61, 145, 255, 255],
      mask: [255, 254, 0, 0],
      prefixBits: 15
    }, {
      from: [61, 146, 0, 0],
      to:   [61, 146, 255, 255],
      mask: [255, 255, 0, 0],
      prefixBits: 16
    }],
    actual);

  // most complex range
  actual = IPlib.getRanges ([221, 90, 0, 0], [221, 97, 255, 255]);
  assertAreEqual ([{
      from: [221, 90, 0, 0],
      to:   [221, 91, 255, 255],
      mask: [255, 254, 0, 0],
      prefixBits: 15
    }, {
      from: [221, 92, 0, 0],
      to:   [221, 95, 255, 255],
      mask: [255, 252, 0, 0],
      prefixBits: 14
    }, {
      from: [221, 96, 0, 0],
      to:   [221, 97, 255, 255],
      mask: [255, 254, 0, 0],
      prefixBits: 15
    }],
    actual);

  /** Compares the actual and expected values. */
  function assertAreEqual (expected, actual) {

    var i;

    if (expected.length !== undefined &&
        actual.length !== undefined &&
        expected.length === actual.length &&
        expected[0].hasOwnProperty('from') &&
        expected[0].hasOwnProperty('to') &&
        expected[0].hasOwnProperty('mask') &&
        expected[0].hasOwnProperty('prefixBits') &&
        actual[0].hasOwnProperty('from') &&
        actual[0].hasOwnProperty('to') &&
        actual[0].hasOwnProperty('mask') &&
        actual[0].hasOwnProperty('prefixBits')        
        ) {

      // test the IP subnets equality
      for (i = 0; i < actual.length; i++) {

        if (expected[i].prefixBits !== actual[i].prefixBits ||
            !areArraysEqual (expected[i].from, actual[i].from) ||
            !areArraysEqual (expected[i].to, actual[i].to) ||
            !areArraysEqual (expected[i].mask, actual[i].mask)) {

          console.log ({expected, actual});
          throw ('IpSubnet test not passed. Expected:' + expected + ', actual: ' + actual);
          //return false;
        }

      }

      console.log ('Ranges test passed');
      return true;

    }
    else if (expected === actual) {
      console.log ('Test passed');
      return true;
    }
    else {
      throw ('Test not passed. Expected:' + expected + ', actual: ' + actual);
      //console.log ('Test not passed. Expected:' + expected + ', actual: ' + actual);
      //return false;
    }

  }

  /** Returns the value indicating whether arrays are equal or not. */
  function areArraysEqual (a, b) {
    return a.every ((value, index) => value === b[index]);
  }

}