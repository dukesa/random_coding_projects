///////////////////////////////////////////////////////////////////
// CashRegister class definition- IRL this is a separate file
///////////////////////////////////////////////////////////////////
class CashRegister {
  constructor(){
    // property to store an array of Drawer objects
    // TODO: is there a way to require the array to contain objects of type Drawer?
    this.mDrawers = [];
  }

  // method to add a drawer object to the mDrawers array
  addDrawer(newDrawer){
    this.mDrawers.push(newDrawer);
  }

  // method to return change.  Format is an object with status string and array of change denominations for each denomination of currency
  getChange(amount, currencyObj){
    var returnMap = new Map;
    var output ={};

    // Convert amount to cents
    amount = Math.round(amount*100);

    if (amount > this.getTotal()){
      // Edge case if not enough cash is given to cover the purchase price, this case is not covered by the examples 
      console.log("not enough dollas");
	 output.status = “MORE_MONEY_PLZ”;
	 output.change = [];
    } else {
      // Get list of currency unit names in descending value order
      var currencyDescending = currencyObj.getMapDescending();
      var currencyUnitNamesDesc = Array.from(currencyDescending.keys());

      // Iterate through each drawer, from the highest denomination
      var amountRemaining = amount;
      for (var unitIdx = 0; unitIdx<currencyUnitNamesDesc.length; unitIdx++){
        // store unit name (ie PENNY) in new var for convenience 
        var thisUnit = currencyUnitNamesDesc[unitIdx];  

        // get index of drawer object that matches unit name
        var unitDrawerIdx = this.getDrawerIdx(thisUnit);
        
        // call Drawer's withdraw method
        var withdrawnAmount = this.mDrawers[unitDrawerIdx].withdraw(amountRemaining);
        
        // decrement amount remaining
        amountRemaining = amountRemaining - withdrawnAmount;

        // store values in return map
        returnMap.set(thisUnit, withdrawnAmount);
      }

       // Format output
       if (amountRemaining != 0){
       // Insufficient funds
         output.status = "INSUFFICIENT_FUNDS";
         output.change = [];
       } else {
         // Set output status
         if (this.getTotal() == 0){
           output.status = "CLOSED";
         } else {
           output.status = "OPEN";
         } 

         // Format change into array
         output.change = []; 
 
         // Iterate over returnMap to get list of currency that returned from the CashRegister and strip out all denominations with value of 0 and store in output object
         for(var cu=0; cu < currencyUnitNamesDesc.length; cu++){
           var currencyValue = returnMap.get(currencyUnitNamesDesc[cu]);
           if(currencyValue != 0){
             // Convert currency value back to dollars and add it to the output array
             output.change.push([currencyUnitNamesDesc[cu], currencyValue/100]);
           }
         }
       }
    }

    console.log(output.status);
    console.log(output.change);
    return output;
  }

  // method to get the index of a drawer from the mDrawers array based on unit name
  getDrawerIdx(name){
    // Iterate through mDrawers array to find the index of the drawer that matches the give name string
    //TODO: there's probably a fancier way to do this but whatever
    for (var d=0; d<this.mDrawers.length; d++){
      if (name == this.mDrawers[d].mCurrencyName){
        //break;
        break;
      }
    }
    return d;
  }

  // method to get the total value of all currency in the register
  getTotal(){
    var runningTotal = 0;

    // Iterate over array of drawers if its non-empty
    if (this.mDrawers.length > 0){
      for(var d=0; d<this.mDrawers.length; d++){
        runningTotal = runningTotal + this.mDrawers[d].getValue();
      }
    }
    return runningTotal;
  }
}

///////////////////////////////////////////////////////////////////
// Drawer class definition- separate file
///////////////////////////////////////////////////////////////////
class Drawer {
  constructor(name, unit_value, total_value){
    //TODO: add error checking if total value is not divisible by unit value
    this.mCurrencyCount = total_value / unit_value; 
    this.mCurrencyName = name;
    this.mCurrencyValue = unit_value;
    //TODO: currency value is stored in Currency object, use that to lookup unit value instead??
  }

  // method to return the total value of the currency unit
  getValue(){
    var myValue = this.mCurrencyCount * this.mCurrencyValue;
    return myValue;
  }

  // method to withdraw currency from the drawer
  withdraw(value){
    var returnValue;
    var requestedCount = Math.floor(value/this.mCurrencyValue);

    // Calculate how much you can return and decrement it from the drawer
    if (requestedCount == 0) {
      returnValue = 0;
    } else if( requestedCount > this.mCurrencyCount){
      // Return as many bills as you can
      returnValue = this.mCurrencyCount * this.mCurrencyValue;
      this.mCurrencyCount = 0;
    } else {
      // Return the requested number of bills
      returnValue = requestedCount * this.mCurrencyValue;
      this.mCurrencyCount = this.mCurrencyCount - requestedCount;
    }

    //console.log("Returning cents:" + returnValue + " in " + this.mCurrencyName);
    return returnValue;
  }
}

///////////////////////////////////////////////////////////////////
// Currency class definition- separate file
///////////////////////////////////////////////////////////////////
class Currency {
  constructor(currencyArray){
    this.mCurrencyMap = new Map(currencyArray); 
  }

  // method to return currency map sorted descending by value
  getMapDescending(){
    var sortedDescending = new Map([...this.mCurrencyMap.entries()].sort((a,b) => b[1] - a[1]));

    return sortedDescending;
  }

  // method to get the value of a key from the currency map
  getValue(key){
    return this.mCurrencyMap.get(key);
  }
}

///////////////////////////////////////////////////////////////////
// checkCashRegister function- separate file
///////////////////////////////////////////////////////////////////

function checkCashRegister(price, cash, cid) {
  // Initialize return value
  var output = {};
  var cid_cents = [];
  
  // Convert to counting money in cents to avoid floating point rounding issues
  for (var c=0; c<cid.length; c++){
    cid_cents.push([cid[c][0], Math.round(100*cid[c][1])]);
  }

  // Create currency "name-to-avilable value" map with cid
  var valueMap = new Map(cid_cents);

  // Create Currency object for USD
  var currencyUSD = new Currency([["PENNY", 1], ["NICKEL", 5], ["DIME", 10], ["QUARTER", 25], ["ONE", 100], ["FIVE", 500], ["TEN", 1000],  ["TWENTY", 2000], ["ONE HUNDRED", 10000]]);

  // Construct CashRegister object
  var MoneyBunny = new CashRegister();

  // Iterate over cid and create a new Drawer object for each row of the input array and store them in the CashRegister
  for (var d=0; d<cid_cents.length; d++){
    // Get currency unit name from input
    var unitName = cid_cents[d][0];

    // Construct a new Drawer object for this  currency unit
   var newDrawer = new Drawer(unitName, currencyUSD.getValue(unitName), valueMap.get(unitName));
    
    // Add new Drawer object to the CashRegister
    MoneyBunny.addDrawer(newDrawer);
  }

  // Calculate change to return
  output = MoneyBunny.getChange(cash-price, currencyUSD);
 
  // Welp, if there's no change left return cid because this is a stupid way they requested the output format 
  if (output.status == "CLOSED"){
    output.change = cid;
  }

  // Here is your change, ma'am.
  return output;
}

///////////////////////////////////////////////////////////////////
// Runtime Section
///////////////////////////////////////////////////////////////////

//checkCashRegister(19.5, 20, [["PENNY", 1.01], ["NICKEL", 2.05], ["DIME", 3.1], ["QUARTER", 4.25], ["ONE", 90], ["FIVE", 55], ["TEN", 20], ["TWENTY", 60], ["ONE HUNDRED", 100]]);

//checkCashRegister(19.5, 20, [["PENNY", 0.01], ["NICKEL", 0], ["DIME", 0],["QUARTER", 0], ["ONE", 0], ["FIVE", 0], ["TEN", 0], ["TWENTY", 0],["ONE HUNDRED", 0]])

//checkCashRegister(3.26, 100, [["PENNY", 1.01], ["NICKEL", 2.05], ["DIME", 3.1], ["QUARTER", 4.25], ["ONE", 90], ["FIVE", 55], ["TEN", 20], ["TWENTY", 60], ["ONE HUNDRED", 100]])

checkCashRegister(19.5, 20, [["PENNY", 0.5],["NICKEL", 0], ["DIME", 0], ["QUARTER", 0], ["ONE", 0], ["FIVE", 0], ["TEN", 0], ["TWENTY", 0], ["ONE HUNDRED", 0]])

