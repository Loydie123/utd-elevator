export default class Elevator {
  static LOBBY_FLOOR = 0;
  static NOON_HOUR = 12;

  constructor() {
    this.currentFloor = Elevator.LOBBY_FLOOR;
    this.stops = 0;
    this.floorsTraversed = 0;
    this.requests = [];
    this.riders = [];
  }

  dispatch() {
    while (this._hasActiveRequests()) {
      const firstRequest = this.requests[0];
      
      if (!firstRequest && this.riders.length === 0) {
        break;
      }
      
      if (firstRequest) {
        this._processRequests(firstRequest);
      }
    }
    
    if (this.checkReturnToLoby()) {
      this.returnToLoby();
    }
  }

  _hasActiveRequests() {
    return this.requests.length > 0 || this.riders.length > 0;
  }

  _processRequests(firstRequest) {
    const targetFloor = firstRequest.dropOffFloor;
    const direction = targetFloor > this.currentFloor ? 1 : -1;
    
    while (this._hasActiveRequests()) {
      this._handleStopsAtCurrentFloor();
      
      if (!this._hasActiveRequests()) {
        break;
      }
      
      this._moveToNextStop(direction);
    }
  }

  _handleStopsAtCurrentFloor() {
    if (this.hasStop()) {
      if (this.requests.some(r => r.currentFloor === this.currentFloor)) {
        this.hasPickup();
        this.stops++;
      }
      if (this.riders.some(r => r.dropOffFloor === this.currentFloor)) {
        this.hasDropoff();
        this.stops++;
      }
    }
  }

  _moveToNextStop(direction) {
    const nextRequest = this.requests[0];
    const nextRider = this.riders[0];
    
    if (nextRequest && !nextRider) {
      this._moveTowardsFloor(nextRequest.currentFloor);
    } else if (nextRider && !nextRequest) {
      this._moveTowardsFloor(nextRider.dropOffFloor);
    } else if (nextRequest && nextRider) {
      if (direction === 1) {
        this.moveUp();
      } else {
        this.moveDown();
      }
    }
  }

  _moveTowardsFloor(targetFloor) {
    if (this.currentFloor === targetFloor) {
      return;
    }
    
    if (this.currentFloor < targetFloor) {
      this.moveUp();
    } else {
      this.moveDown();
    }
  }

  goToFloor(person) {
    this._travelToFloor(person.currentFloor);
    this.hasPickup();
    this.stops++;
    
    this._travelToFloor(person.dropOffFloor);
    this.hasDropoff();
    this.stops++;
    
    if (this.checkReturnToLoby()) {
      this.returnToLoby();
    }
  }

  _travelToFloor(targetFloor) {
    while (this.currentFloor !== targetFloor) {
      if (this.currentFloor < targetFloor) {
        this.moveUp();
      } else {
        this.moveDown();
      }
    }
  }

  moveUp() {
    this.currentFloor++;
    this.floorsTraversed++;
  }

  moveDown() {
    if (this.currentFloor > Elevator.LOBBY_FLOOR) {
      this.currentFloor--;
      this.floorsTraversed++;
    }
  }

  hasStop() {
    const hasPickupAtFloor = this.requests.some(
      request => request.currentFloor === this.currentFloor
    );
    const hasDropoffAtFloor = this.riders.some(
      rider => rider.dropOffFloor === this.currentFloor
    );
    return hasPickupAtFloor || hasDropoffAtFloor;
  }

  hasPickup() {
    const pickupIndex = this.requests.findIndex(
      request => request.currentFloor === this.currentFloor
    );
    
    if (pickupIndex !== -1) {
      const person = this.requests.splice(pickupIndex, 1)[0];
      this.riders.push(person);
    }
  }

  hasDropoff() {
    const dropoffIndex = this.riders.findIndex(
      rider => rider.dropOffFloor === this.currentFloor
    );
    
    if (dropoffIndex !== -1) {
      this.riders.splice(dropoffIndex, 1);
    }
  }

  checkReturnToLoby() {
    const currentHour = new Date().getHours();
    const noRiders = this.riders.length === 0;
    const isBeforeNoon = currentHour < Elevator.NOON_HOUR;
    
    return noRiders && isBeforeNoon;
  }

  returnToLoby() {
    while (this.currentFloor > Elevator.LOBBY_FLOOR) {
      this.moveDown();
    }
  }

  reset() {
    this.currentFloor = Elevator.LOBBY_FLOOR;
    this.stops = 0;
    this.floorsTraversed = 0;
    this.riders = [];
  }
}
