
var cElevator = { wait:"wait", moveup:"up", movedown:"down", closing:"closing", opening: "opening" };
var cLocations = { outside:"outside", elobby:"elobby", elevator:"elevator", office:"office"};
var cTravel = { outside:45, elobby:5, office:45 };
var cFloors = { ground:"ground", One:"One", Two:"Two", Three:"Three", Four:"Four"};

var arrFloorMatrix = [ ["One", 400], ["Two", 400], ["Three", 400], ["Four", 400] ]
var totalPeople = 2;

var debug = true;
var running = true;
var stat = { iteration:0 };


function Person(blnVisitor) {
    this.travel = { 
          location:"elobby" 
         ,eta:-1
         ,floor:"ground"
         ,destination:"ground"
         ,work:"ground"
         ,elevator:0 };
    
    // Randomly get destination by weight
    iPerson = Math.floor( 1 + Math.random() * 1600 );

    var i;
    for( intI = 0; intI < 4; intI++) {
        if ( iPerson > arrFloorMatrix[intI][1] )
            iPerson -= arrFloorMatrix[intI][1];
        else {
            this.travel.destination = arrFloorMatrix[intI][0];
            arrFloorMatrix[intI][1]--;
            totalPeople--;
            break;
        }
    }

    this.staytime = 0;  // How long person stays @ work
                        // Employees stay for 8 hrs +- 1 hr
                        // Visitors stay for 45 minutes +- 15 minutes
                        
    this.lunchtime = 0; // Lunch Time in seconds +- 30 minutes
                        // Visitors has no lunch time  ( 0 )

    if (blnVisitor) {
        this.staytime = Math.floor( 60 * ( 30 + ( Math.random() * 30) ) );
    } else {
        this.staytime = Math.floor( 60 * 60 * ( 7 + ( Math.random() * 2) ) );
        this.lunchtime = Math.floor( 60 * 60 * ( 11.5 + Math.random() ) );
    }
    
    // affects walking speed to lobby, entering elevator, etc.
    // ranges between 80% to 120% of normal time
    this.speed = 0.80 + ( Math.random() * 0.4 );  

    this.waitTime = 0;
    this.travel.eta = Math.floor( cTravel.outside * this.speed );
    this.waits = new Array();
}

Person.prototype.MoveTo = function ( pLocation, pEta ) {
	
//	   this.travel.destination = pLocation;
	   this.travel.eta = pEta;
	
}

Person.prototype.Move = function () {
    if ( this.travel.eta > 0 ) {
	       this.travel.eta--;
	       return true;
	   } else if ( this.travel.eta == 0 ) {
//		      this.travel.location = this.travel.destination;
        return false;
		  }
		  return false;
}

function Elevator() {
    this.floor = "ground";
    this.up = true;
    this.status = "wait";
    this.eta = 0;
    this.passengers = 0;
    this.specs = { door:10, starting:10, moving:5,capacity:24 };
}
/**/

var tenants = new Array();
var left = new Array();
var lifts = new Array();

// iterates the equivalent of 1 second

stat.iteration  = 27000;
lifts.push( new Elevator());
lifts.push( new Elevator());
lifts.push( new Elevator());

function iteration() {
    
    shift1 = Math.floor( 60 * 60 * 7.5 );
    
    if (running) {
        for( intIterate = 0 ; 
             intIterate <= 25; 
             intIterate++ ) {
            stat.iteration++
            
            // Add new People into the Building
            if ( stat.iteration > shift1 ) {
                if ( totalPeople > 0 )
                    tenants.push( new Person( false ));
            }
            
            // Move People            
            for ( intI = 0; intI < tenants.length; intI++ ){
                if ( tenants[intI].Move() ) {  // person is going to the location
                    DEBUG( "Traveling..." );
//                    tenants[intI].travel.eta--;
                } else { // person is at the location
                    switch ( tenants[intI].travel.location ) {
                        case cLocations.elobby:
                            for ( intJ = 0; intJ < lifts.length; intJ++ ){
                                if ( ( lifts[intJ].floor == tenants[intI].travel.floor ) &&
                                     ( ( lifts[intJ].status == cElevator.wait ) ||
                                       ( lifts[intJ].status == cElevator.closing ) ) && 
                                     ( lifts[intJ].passengers < lifts[intJ].specs.capacity ) ) {
                                    lifts[intJ].status = cElevator.closing;                          
                                    lifts[intJ].eta = lifts[intJ].specs.door;                             
                                    lifts[intJ].passengers++;
                                    tenants[intI].MoveTo(
                                            cLocations.elevator
                                           ,Math.floor( cTravel.elobby * this.speed ) );
                                    continue;
                                }
                            }
                            
                            DEBUG( "Waiting..." );
                            tenants[intI].waitTime++;
                            break;
                        case cLocations.elevator:
                            for ( intJ = 0; intJ < lifts.length; intJ++ ){
                                if ( ( lifts[intJ].floor == tenants[intI].travel.destination ) &&
                                     ( lifts[intJ].status == cElevator.wait ) ) {
	
	 																												if ( lifts[intJ].floor == cFloors.ground ) {
																														   tenants[intI].travel.location = tenants[intI].travel.destination;
																													} else {
																														   tenants[intI].travel.location = cFloors.ground;
																													}
	
                                    tenants[intI].travel.eta = Math.floor( cTravel.elobby * this.speed );
      																									
																													if ( lifts[intJ].eta < tenant[intI].eta ) {
																														   lifts[intI].status = cElevator.closing;
																														   lifts[intJ].eta = tenant[intI].eta + lifts[intJ].specs.door;
																													}                             
                                    lifts[intJ].passengers--;
                                    continue;
                                }
                            }
                            DEBUG( "Elevating..." );
                            tenants[intI].waitTime++;
                            break;
                        case cLocations.office:
                            DEBUG( "Working..." );
                            tenants[intI].waitTime = 0;
                            break;
                    }
                }
                tenants[intI];
            }
            
            
            // Move Elevators        
            for ( intI = 0; intI < lifts.length; intI++ ){
                if ( tenants[intI].travel.eta > 0 ) {
                    DEBUG( "Traveling..." );
                    tenants[intI].travel.eta--;
                } else {
                    switch ( tenants[intI].travel.location ) {
                        case cLocations.elobby:
                            DEBUG( "Waiting..." );
                            tenants[intI].waitTime++;
                            break;
                        case cLocations.elevator:
                            DEBUG( "Elevating..." );
                            tenants[intI].waitTime++;
                            break;
                        case cLocations.office:
                            DEBUG( "Working..." );
                            tenants[intI].waitTime = 0;
                            break;
                    }
                }
                tenants[intI];
            }
            
            
            DEBUG( stat.iteration );
            if ( tenants.length > 0 ) DEBUG( tenants );
        }
    }
}

function DEBUG(strMessage) {    
    if (debug) {
        console.log(strMessage);
    }    
}