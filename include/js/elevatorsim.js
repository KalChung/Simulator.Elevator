
var cPersonState = { work:"work", break:"break", home:"home" };
var cElevator = { wait:"wait", idle:"idle", moving:"moving", closing:"closing", opening: "opening" };
var cLocations = { outside:"outside", elobby:"elobby", elevator:"elevator", office:"office"};
var cTravel = { outside:45, elobby:5, office:45, break:30 };

var arrFloorMatrix = [ ["ground", false, 0, 0], ["Two", false, 400, 0], ["Three", false, 400, 0], ["Four", false, 400, 0], ["Five", false, 400, 0] ]
var totalPeople = 1600;

var debug = false;
var running = true;
var stat = { iteration:0, started:false, iterate:0 };
var simVars = { wait:1, id:0, iterate:100 };

// ------   PERSON CLASS   ---------------------------
function Person(blnVisitor) {
    this.travel = { 
          location:"elobby" 
         ,status:"work"
         ,eta:-1
         ,floor:0  // always start at the ground floor
         ,work:-1
         ,elevator:-1 };
    
    // Randomly get destination by weight
    iPerson = Math.floor( 1 + Math.random() * 1600 );

    var i;
    for( intI = 0; intI < arrFloorMatrix.length ; intI++ ) {
        if ( iPerson > arrFloorMatrix[intI][2] )
            iPerson -= arrFloorMatrix[intI][2];
        else {
            this.travel.work = intI;
            arrFloorMatrix[intI][2]--;
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
    this.waits = new Array();

    this.MoveTo ( cLocations.elobby, cTravel.outside );
//    this.travel.eta = Math.floor( cTravel.outside * this.speed );
}

Person.prototype.SaveWait = function ( ) {
    this.waits [ this.waits.length ] = this.waitTime;
    this.waitTime = 0;
}

Person.prototype.MoveNext = function ( ) {
    switch ( this.travel.location ) {
        case cLocations.outside:
            if ( this.travel.status == cPersonState.work ) {
                this.travel.location = cLocations.elobby;
                this.travel.eta = Math.floor ( cTravel.outside * this.speed ) ; 
                this.SaveWait ();
            } else if ( this.travel.status == cPersonState.break ) {
                this.travel.status = cPersonState.work;
                this.travel.eta = Math.floor ( cTravel.break * this.speed ) ; 
                this.SaveWait ();
            } 

            // If the person is going home, another BI should handle removing the person,
            // from the queue.

            break;
        case cLocations.elobby:  // People in the elobby will enter the elevator
            this.travel.location = cLocations.elevator;
            this.travel.eta = Math.floor ( cTravel.elobby * this.speed ) ; 
            this.SaveWait ();
            break;
        case cLocations.elevator:  // People exiting the elevator no longer stops in the lobby
            if ( this.travel.status == cPersonState.work ) {
                this.travel.location = cLocations.office;
                this.travel.eta = Math.floor ( ( cTravel.office + cTravel.elobby ) * this.speed ) ; 
            } else  { // Person's either on break or going home...
                    this.travel.location = cLocations.outside;
                    this.travel.eta = Math.floor ( ( cTravel.outside + cTravel.elobby ) * this.speed ) ; 
            }
            this.SaveWait ();
            break;
        case cLocations.office:
            if ( this.travel.status == cPersonState.home ||
                 this.travel.status == cPersonState.break ) {                
                this.travel.location = cLocations.elobby;
                this.travel.eta = Math.floor ( cTravel.office * this.speed ) ; 
                this.SaveWait ();
            }
            break;
    }
}

Person.prototype.MoveTo = function ( pLocation, pEta ) {	
//	   this.travel.destination = pLocation;
	this.travel.eta = Math.floor ( pEta * this.speed ) ;	
}

Person.prototype.Move = function () {
    if ( this.travel.eta > 0 ) {
        this.travel.eta--;
        return true;
    } 
	return false;
}

Person.prototype.Debug = function ( pNumber ) {

    return;

    strMessage = "Person #" + pNumber + " ";

    switch ( tenants[intI].travel.status ) {
        case cPersonState.work:
            strMessage += "is going to work ";
            break;
        case cPersonState.break:
            strMessage += "is going for a break ";
            break;
        case cPersonState.home:
            strMessage += "is going home ";
            break;
    }

    if ( this.travel.eta > 0 ) {  
        strMessage += " is moving  ";
    } else { // person is at the location
        switch ( tenants[intI].travel.location ) {
            case cLocations.elobby:
                strMessage += "from the lobby ";
                break;
            case cLocations.elevator:
                strMessage += "from Elevator #" + this.travel.elevator + " "
                break;
            case cLocations.office:
                strMessage += "and is at the office ";
                break;
        }
    } 

    DEBUG ( this );
    MSG ( strMessage + "on Floor " + this.travel.floor + " with Office @ " + this.travel.work );


}
// ---------------------------------


// ------   ELEVATOR CLASS   ---------------------------
function Elevator() {
    this.floor = 0;  // always start at the ground floor
    this.up = true;
    this.status = "idle";
    this.eta = 0;
    this.passengers = 0;
    this.specs = { door:10, starting:8, moving:3, capacity:20 };

    this.idleTime = 0;
    this.idleTimes = new Array();
}
/**/

Elevator.prototype.Debug = function ( pNumber ) {

    return;
    switch ( lifts[intJ].status ) {
        case cElevator.idle:
            strMessage = " is idle. ";
            break;
        case cElevator.wait:
            strMessage = " is waiting... ";
            break;
        case cElevator.moving:
            strMessage = " is moving... ";
            break;
        case cElevator.closing:
            strMessage = " is closing... ";
            break;
        case cElevator.opening:
            strMessage = " is opening... ";
            break;
    }

    DEBUG ( this );

    if ( this.passengers == 0 ) {
        MSG ( "Elevator #" + pNumber + strMessage + "on Floor " + this.floor);
    } else if ( this.passengers == this.specs.capacity ) {
        MSG ( "FULL Elevator #" + pNumber + strMessage + "on Floor " + this.floor);
    } else {
        MSG ( "LOADED Elevator #" + pNumber + strMessage + "on Floor " + this.floor);
    }

}

Elevator.prototype.SaveIdle = function ( ) {
    this.idleTimes [ this.idleTimes.length ] = this.idleTime;
    this.idleTime = 0;
}

Elevator.prototype.Available = function ( pFloor ) {
    if ( this.floor == pFloor &&
         this.passengers < this.specs.capacity &&
         ( this.status == cElevator.wait ||
           this.status == cElevator.closing ) ) {
        return true;
    } 

    return false;
}

Elevator.prototype.CanExit = function ( pFloor ) {
    if ( this.floor == pFloor &&
         ( this.status == cElevator.wait ||
           this.status == cElevator.closing ) ) {
        return true;
    } 

    return false;
}

Elevator.prototype.StartMoving = function ( pMoreTime ) {
    this.status = cElevator.moving;
    this.eta = this.specs.moving + pMoreTime;

    if ( this.up ) {
        this.floor++;
    } else {
        this.floor--;
    }
}

Elevator.prototype.OpenDoor = function ( ) {
    this.status = cElevator.opening;                          
    this.eta = this.specs.door;                  
}

Elevator.prototype.CloseDoor = function ( ) {
    arrFloorMatrix[ this.floor ][1] = false;

    this.status = cElevator.closing;                          
    this.eta = this.specs.door;                  
}

Elevator.prototype.Move = function () {
    if ( this.eta > 0 ) {
        this.eta--;
        return true;
    } 
    return false;
}
// ---------------------------------



var tenants = new Array();
var left = new Array();
var lifts = new Array();

// iterates the equivalent of 1 second

stat.iteration  = 27000;
//lifts.push( new Elevator());

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

function iteration2time( pIteration ) {
    intIteration = pIteration;
    intSecond = pIteration % 60;
    intMinute = Math.floor(pIteration / 60 );
    intHour = Math.floor(intMinute / 60 )
    intMinute = intMinute % 60;

    return intHour + ":" + pad(intMinute, 2) + "." + pad(intSecond, 2) ;

}

function update_displayVariables() {

    if (!stat.started)
        $("#dvStartIteration").val( stat.iteration );
    else {
        $("#dvIteration").val( iteration2time( stat.iteration ) );

        $("#dvF1Employees").val( arrFloorMatrix[0][2] );
        $("#dvF2Employees").val( arrFloorMatrix[1][2] );
        $("#dvF3Employees").val( arrFloorMatrix[2][2] );
        $("#dvF4Employees").val( arrFloorMatrix[3][2] );
        $("#dvF5Employees").val( arrFloorMatrix[4][2] );

        $("#dvF1People").val( arrFloorMatrix[0][3] );
        $("#dvF2People").val( arrFloorMatrix[1][3] );
        $("#dvF3People").val( arrFloorMatrix[2][3] );
        $("#dvF4People").val( arrFloorMatrix[3][3] );
        $("#dvF5People").val( arrFloorMatrix[4][3] );
    }
}


function iteration() {
    
    if (!stat.started) {
        $("#dvLifts").prop( "readonly", true);
        $("#dvLifts").attr( "class", "dvReadonly");

        $("#dvStartIteration").prop( "readonly", true);
        $("#dvStartIteration").attr( "class", "dvReadonly");

        for( intLifts = 0 ; 
             intLifts < $("#dvLifts").val(); 
             intLifts++ )
            lifts.push( new Elevator());
    }

    stat.started = true;

    for( intI = 0; intI < arrFloorMatrix.length ; arrFloorMatrix[intI++][3] = 0 );


    shift1 = Math.floor( 60 * 60 * 7.5 );
    
/*    if (running) {
        for( intIterate = 0 ; 
             intIterate <= 25; 
             intIterate++ ) { */
            stat.iteration++;
            
            // Add new People into the Building
            if ( stat.iteration > shift1 ) {
                if ( totalPeople > 0 )
                    tenants.push( new Person( false ));
            }
            
            // Move People            
            for ( intI = 0; intI < tenants.length; intI++ ){
                arrFloorMatrix[ tenants[intI].travel.floor ][3]++;
                tenants[intI].Debug (intI);
                if ( tenants[intI].Move() ) {  // person is going to the location
                } else { // person is at the location
                    switch ( tenants[intI].travel.location ) {
                        case cLocations.elobby:
                            intJ = 0;
                            for ( ; intJ < lifts.length; intJ++ ){
                                if ( lifts[intJ].Available ( tenants[intI].travel.floor ) ) {
                                    lifts[intJ].CloseDoor ();                       
                                    lifts[intJ].passengers++;
                                    tenants[intI].travel.elevator = intJ;
                                    tenants[intI].MoveNext ();
                                    break;
                                }
                            }

                            if ( intJ <lifts.length )
                                continue;
                            
                            arrFloorMatrix[ tenants[intI].travel.floor ][1] = true;

                            tenants[intI].waitTime++;
                            break;
                        case cLocations.elevator:
                            intJ = tenants[intI].travel.elevator;

                            if ( tenants[intI].travel.status == cPersonState.work &&
                                 lifts[intJ].CanExit ( tenants[intI].travel.work ) ) {
                                tenants[intI].travel.floor = lifts[intJ].floor;
                                lifts[intJ].passengers--;
                                tenants[intI].MoveNext ();
                            } else  if ( tenants[intI].travel.status != cPersonState.work &&
                                         lifts[intJ].CanExit ( 0 ) ) { // Check ground floor
                                lifts[intJ].passengers--;
                                tenants[intI].MoveNext ();
                            } else {
                                tenants[intI].waitTime++;                                
                            }
                            break;
                        case cLocations.office:
                            tenants[intI].waitTime = 0;
                            break;
                    }
                }
            }            
            
            // Move Elevators        
            for ( intJ = 0; intJ < lifts.length; intJ++ ){
                lifts[intJ].Debug ( intJ );
                if ( lifts[intJ].Move () ) {
                } else {
                    switch ( lifts[intJ].status ) {
                        case cElevator.idle:
                            for( intK = 0; intK < arrFloorMatrix.length ; intK++ ) {
                                if ( arrFloorMatrix[ lifts[intJ].floor ][1] ) {
                                    if ( intK < lifts[intJ].floor ) {
                                        lifts[intJ].up = false;
                                        lifts[intJ].StartMoving ( lifts[intJ].specs.starting );
                                    } else if ( intK > lifts[intJ].floor ) {
                                        lifts[intJ].up = true;
                                        lifts[intJ].StartMoving ( lifts[intJ].specs.starting );
                                    } else {  // its on the same floor
                                        lifts[intJ].OpenDoor ();
                                    }
                                    break;
                                }
                            }
                            lifts[intJ].idleTime++;
                            break;
                        case cElevator.wait:
                            lifts[intJ].CloseDoor ();
                            break;
                        case cElevator.moving:
                            var needToStop = false;

                            if ( lifts[intJ].passengers > 0 ) {
                                for ( intI = 0; intI < tenants.length  && !needToStop; intI++ ){
                                    if ( tenants[intI].travel.elevator == intJ &&
                                         ( ( tenants[intI].travel.status == cPersonState.work  &&
                                             lifts[intJ].floor == tenants[intI].travel.work ) ||
                                           ( tenants[intI].travel.status != cPersonState.work  &&
                                             lifts[intJ].floor == 0 ) ) ) {  // person is going to the location
                                        needToStop = true;
                                    }
                                }
                            } else {
                                if ( arrFloorMatrix[ lifts[intJ].floor ][1] ) {
                                    needToStop = true;
                                }
                            }

                            if ( needToStop ) {
                                lifts[intJ].OpenDoor ();
                            } else {
                                if ( lifts[intJ].up && 
                                     lifts[intJ].floor == ( arrFloorMatrix.length - 1 ) ) {
                                    lifts[intJ].up = false;
                                    lifts[intJ].StartMoving ( lifts[intJ].specs.starting );    
                                } else if ( !lifts[intJ].up && 
                                         lifts[intJ].floor == 0 ) {
                                    lifts[intJ].status = cElevator.idle;
                                } else {
                                    lifts[intJ].StartMoving ( 0 );
                                }
                            }
                            break;
                        case cElevator.closing:
                            if ( ( lifts[intJ].up && 
                                   lifts[intJ].floor < ( arrFloorMatrix.length - 1 ) ) ||
                                 ( !lifts[intJ].up && 
                                   lifts[intJ].floor > 0 ) )  {
                                if ( ( lifts[intJ].up && 
                                       lifts[intJ].floor == 0 ) &&
                                     lifts[intJ].passengers == 0 )  {
                                    lifts[intJ].status = cElevator.idle;
                                } else {
                                    lifts[intJ].StartMoving ( lifts[intJ].specs.starting );
                                }
                            } else if ( lifts[intJ].up ) {
                                lifts[intJ].up = false;
                                lifts[intJ].StartMoving ( lifts[intJ].specs.starting );
                            } else {
                                lifts[intJ].up = true;

                                if ( lifts[intJ].passengers > 0 )
                                    lifts[intJ].StartMoving ( lifts[intJ].specs.starting );
                                else
                                    lifts[intJ].status = cElevator.idle;
                            }
                            break;
                        case cElevator.opening:
                            lifts[intJ].status = cElevator.wait;
                            lifts[intJ].eta = 5;
                            break;
                    }
                }
            }
            
//          update_displayVariables();

//            MSG( "\n" + iteration2time( stat.iteration )  );


            if ( ++stat.iterate >= simVars.iterate ) {
                update_displayVariables();
                clearInterval( simVars.id );
            }
//        }
//        if ( tenants.length > 0 ) DEBUG( tenants ); 
//    }
}

function DEBUG(strMessage) {    
    if (debug) {
        console.log(strMessage);
        $("#console").val( $("#console").val() + strMessage + "\n" );
    }    
}

function MSG(strMessage) {     
    console.log(strMessage);
    $("#console").val( $("#console").val() + strMessage + "\n" );
}