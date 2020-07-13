'use strict';

const {Contract} = require('fabric-contract-api');

class UserReg extends Contract 
{
	
	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.property-network.registation');
	}
	
	/* ****** All custom functions are defined below ***** */
	
	// This is a basic user defined function used at the time of instantiating the smart contract
	// to print the success message on console
	async instantiate(ctx) {
		console.log('Property Registration Smart Contract Instantiated');
	}
//This transaction is called by the user to request the registrar to register them on the property-registration-network. 


	async requestNewUser(ctx, Name, Email, PhoneNumber, AadharNumber) {
		// Create a new composite key for the new user request account
		const requestkey = ctx.stub.createCompositeKey('org.property-network.registration.request', [Name + '-' +AadharNumber]);
		
		// Create a newrequest object to be stored in blockchain
		let newRequestObject = {
			Name: Name,
			Email: Email,
			PhoneNumber: PhoneNumber,
			AadharNumber: AadharNumber,
			createdAt: new Date(),
			
		};
		
		// Convert the JSON object to a buffer and send it to blockchain for storage
		let dataBuffer = Buffer.from(JSON.stringify(newRequestObject));
		await ctx.stub.putState(requestKey, dataBuffer);
		// Return value of new user account created to user
		return newRequestObject;
	}
	async rechargeAccount(ctx, Name, AadharNumber, BankId) {
		const userkey = ctx.stub.createCompositeKey('org.property-network.registration.user', [Name + '-' +AadharNumber]);
		
		if (BankId === 'upg100' || BankId === 'upg500' || BankId === 'upg1000') {
			let useBuffer = await ctx.stub
			.getState(userKey)
			.catch(err => console.log(err));
			let useobj = JSON.parse(useBuffer.toString());
			if(BankId === 'upg100')
			{
				useobj.upgradCoins = 100;
			}
			if(BankId === 'upg500')
			{
				useobj.upgradCoins = 500;
			}
			if(BankId === 'upg1000')
			{
				useobj.upgradCoins = 1000;
			}
			
		// Convert the JSON object to a buffer and send it to blockchain for storage
			let usBuffer = Buffer.from(JSON.stringify(useobj));
		await ctx.stub.putState(userKey, usBuffer);


		}
		else{
			throw new Error('Invalid Bank Transaction ID');
		}
	}
	async propertyRegistrationRequest(ctx, PropertyID, Owner, Price, Status, Name, AadharNumber) {
		const userkey = ctx.stub.createCompositeKey('org.property-network.registration.user', [Name + '-' +AadharNumber]);
		const proprequestkey = ctx.stub.createCompositeKey('org.property-network.registration.prop', [PropertyID]);

		let newPropRequestObject = {
			PropertyID: PropertyID,
			Owner: userkey,
			Price: Price,
			Status: Status,
			};
			
		// Convert the JSON object to a buffer and send it to blockchain for storage
		let propBuffer = Buffer.from(JSON.stringify(newPropRequestObject));
		await ctx.stub.putState(proprequestKey, propBuffer);
		// Return value of new user account created to user
		return newPropRequestObject;
		
	}

	async updateProperty(ctx, PropertyID, Name, AadharNumber, Status) {
		const propertykey = ctx.stub.createCompositeKey('org.property-network.registration.propertyasset', [PropertyID]);
		const userkey = ctx.stub.createCompositeKey('org.property-network.registration.user', [Name + '-' +AadharNumber]);

		let buffer1 = await ctx.stub
		       .getState(propertykey)
		       .catch(err => console.log(err));
		
		let pobj1 = JSON.parse(buffer1.toString());
		

		if (pobj1.Owner === userkey)
		{
            pobj1.Status=Status;
		}
		
		// Convert the JSON object to a buffer and send it to blockchain for storage

		let buffer2 = Buffer.from(JSON.stringify(pobj1));
		await ctx.stub.putState(propertykey, buffer2);
	}

	async viewProperty(ctx, PropertyID) {
		// Create the composite key required to fetch record from blockchain
		const propertykey = ctx.stub.createCompositeKey('org.property-network.registration.propertyasset', [PropertyID]);
		
		// Return value of propertykey account from blockchain
		let buffer4 = await ctx.stub
				.getState(propertykey)
				.catch(err => console.log(err));
		return JSON.parse(buffer4.toString());
	}	

	async viewUser(ctx, Name, AadharNumber) { 
		// Create the composite key required to fetch record from blockchain
		const userkey = ctx.stub.createCompositeKey('org.property-network.registration.user', [Name + '-' +AadharNumber]);
		
		// Return value of user account from blockchain
		let buffer5 = await ctx.stub
				.getState(userkey)
				.catch(err => console.log(err));
		return JSON.parse(buffer5.toString());
	}
	
	async purchaseProperty(ctx, PropertyID, Name, AadharNumber) {

		const userkey = ctx.stub.createCompositeKey('org.property-network.registration.user', [Name + '-' +AadharNumber]);
		const propertykey = ctx.stub.createCompositeKey('org.property-network.registration.propertyasset', [PropertyID]);
		
		let probuffer = await ctx.stub
				.getState(propertykey)
				.catch(err => console.log(err));
				//convert into JSON onjext
		let proobj = JSON.parse(probuffer.toString());

		let ubuffer = await ctx.stub
				.getState(userkey)
				.catch(err => console.log(err));
				//convert into JSON onjext
		let uobj = JSON.parse(ubuffer.toString());

		let ownerbuff = await ctx.stub
		.getState(proobj.Owner)
		.catch(err => console.log(err));

		//convert into JSON onjext
        let ownerobj = JSON.parse(ownerbuff.toString());
         //It checks the status of the property to verify whether the property is listed for sale.
        //It checks whether the initiator of the transaction has sufficient account balance.
		if (proobj.Status === 'onSale')
		{
			if (uobj.upgradCoins >= proobj.Price)
			{
				//After all the validations, the owner of the property is updated.
                //An amount equal to the cost of the property gets deducted from the buyer and gets added to its seller
				proobj.Owner = userkey;
                uobj.upgradCoins = uobj.upgradCoins - proobj.Price;
		        ownerobj.upgradCoins = ownerobj.upgradCoins + proobj.Price;
				proobj.Status = 'registered';
			}
		}
		// Convert the JSON object to a buffer and send it to blockchain for storage
		let buffer7 = Buffer.from(JSON.stringify(proobj));
		await ctx.stub.putState(propertykey, buffer7);
		
		
	}


}


class Registrar extends Contract {
	
	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.property-network.registration');
	}
	
	/* ****** All custom functions are defined below ***** */
	
	// This is a basic user defined function used at the time of instantiating the smart contract
	// to print the success message on console
	async instantiate(ctx) {
		console.log('Property Registration Smart Contract Instantiated');
	}
	//The registrar initiates a transaction to register a new user on the ledger based on the request received. 
	async approveNewUser(ctx, Name, AadharNumber) {
		//get the MSPID who called transaction
		let approver = ctx.clientIdentity.getMSPID();
		// Create the composite key required to fetch record from blockchain
		const requestKey = ctx.stub.createCompositeKey('org.property-network.registration.request', [Name + '-' +AadharNumber]);
		const userkey = ctx.stub.createCompositeKey('org.property-network.registration.user', [Name + '-' +AadharNumber]);
		
		// to verify the transaction is called by registrar
		if (approver === 'registrarMSP') 
		{

		 // Return value of user request account from blockchain
		 let requestBuffer = await ctx.stub
				.getState(requestKey)
				.catch(err => console.log(err));
				//convert into JSON onjext
		 let userobj = JSON.parse(requestBuffer.toString());
		 //A new field named ‘upgradCoins’ will get added as an attribute.
		 userobj.upgradCoins = 0;
		 // Convert the JSON object to a buffer and send it to blockchain for storage
		 let userBuffer = Buffer.from(JSON.stringify(userobj));
		 await ctx.stub.putState(userKey, userBuffer);
		
		}

	}
	
	//This function is used by the registrar to create a new ‘Property’ asset on the network after performing some manual checks on the request received for property registration.

    async approvePropertyRegistration(ctx, PropertyID) {

		let approvers = ctx.clientIdentity.getMSPID();
		// Create the composite key required to fetch record from blockchain
		const proprequestkey = ctx.stub.createCompositeKey('org.property-network.registration.prop', [PropertyID]);
		const propertykey = ctx.stub.createCompositeKey('org.property-network.registration.propertyasset', [PropertyID]);
		
        if (approvers === 'registrarMSP') {
		 // Return value of property account from blockchain
		 let propreqBuffer = await ctx.stub
		 .getState(proprequestKey)
		 .catch(err => console.log(err));
		
		 let propertyobj = JSON.parse(propreqBuffer.toString());
		
		 // Convert the JSON object to a buffer and send it to blockchain for storage.
		 let propertyBuffer = Buffer.from(JSON.stringify(propertyobj));
		 await ctx.stub.putState(propertyKey, propertyBuffer);
		}
  
	}
	async viewProperty(ctx, PropertyID) {
		// Create the composite key required to fetch record from blockchain
		const propertykey = ctx.stub.createCompositeKey('org.property-network.registration.propertyasset', [PropertyID]);
		
		// Return value of property account from blockchain
		let buffer3 = await ctx.stub
				.getState(propertykey)
				.catch(err => console.log(err));
		return JSON.parse(buffer3.toString());
	}	

	async viewUser(ctx, Name, AadharNumber) { 
		// Create the composite key required to fetch record from blockchain
		const userkey = ctx.stub.createCompositeKey('org.property-network.registration.user', [Name + '-' +AadharNumber]);
		
		// Return value of user account from blockchain
		let buffer6 = await ctx.stub
				.getState(userkey)
				.catch(err => console.log(err));
		return JSON.parse(buffer6.toString());
	}

}

module.exports = UserReg;
module.exports = Registrar;
