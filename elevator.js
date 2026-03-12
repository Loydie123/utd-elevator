export default class Elevator {
  constructor() {
    this.currentFloor = 0
    this.stops = 0
    this.floorsTraversed = 0
    this.requests = []
    this.riders= []
  }

  dispatch(){
    this.requests.forEach(request => {
      if(this.riders.length || this.requests.length){
        this.goToFloor(request)
      }
    })
  }

  goToFloor(person){  
    while(this.currentFloor !== person.currentFloor){
      if(this.currentFloor < person.currentFloor){
        this.moveUp()
      } else {
        this.moveDown()
      }
    }
    
    this.hasPickup()
    
    while(this.currentFloor !== person.dropOffFloor){
      if(this.currentFloor < person.dropOffFloor){
        this.moveUp()
      } else {
        this.moveDown()
      }
    }
    
    this.hasDropoff()
    
    if(this.checkReturnToLoby()){
      this.returnToLoby()
    }
  }

  moveUp(){
    this.currentFloor++
    this.floorsTraversed++
    if(this.hasStop()){
      this.stops++
    }    
  }

  moveDown(){
    if(this.currentFloor > 0){      
      this.currentFloor--
      this.floorsTraversed++
      if(this.hasStop()){
        this.stops++
      }
    }
  }

  hasStop(){
    const hasPickupAtFloor = this.requests.some(request => request.currentFloor === this.currentFloor)
    const hasDropoffAtFloor = this.riders.some(rider => rider.dropOffFloor === this.currentFloor)
    return hasPickupAtFloor || hasDropoffAtFloor
  }

  hasPickup(){
    const pickupIndex = this.requests.findIndex(request => request.currentFloor === this.currentFloor)
    if(pickupIndex !== -1){
      const person = this.requests.splice(pickupIndex, 1)[0]
      this.riders.push(person)
    }
  }

  hasDropoff(){
    const dropoffIndex = this.riders.findIndex(rider => rider.dropOffFloor === this.currentFloor)
    if(dropoffIndex !== -1){
      this.riders.splice(dropoffIndex, 1)
    }
  }

  checkReturnToLoby(){
    const currentHour = new Date().getHours()
    const noRiders = this.riders.length === 0
    const isBeforeNoon = currentHour < 12
    
    if(noRiders && isBeforeNoon){
      return true
    }
    return false
  }

  returnToLoby(){
    while(this.currentFloor > 0){
      this.moveDown()
    }
  }

  reset(){
    this.currentFloor = 0
    this.stops = 0
    this.floorsTraversed = 0
    this.riders = []
  }
}
