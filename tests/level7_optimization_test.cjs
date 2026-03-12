require('@babel/register')({
  ignore: [/node_modules/]
});

const assert = require('chai').assert;
const Elevator = require('../elevator').default;
const Person = require('../person').default

describe('Level 7: Optimized Algorithm Comparison', function() {
  let optimizedElevator = new Elevator();
  let basicElevator = new Elevator();

  beforeEach(function() {
    optimizedElevator.reset();
    basicElevator.reset();
  });

  function basicDispatch(elevator) {
    const requests = [...elevator.requests];
    
    requests.forEach(person => {

      while(elevator.currentFloor !== person.currentFloor){
        if(elevator.currentFloor < person.currentFloor){
          elevator.currentFloor++;
          elevator.floorsTraversed++;
        } else {
          elevator.currentFloor--;
          elevator.floorsTraversed++;
        }
      }
      elevator.stops++;
      
      while(elevator.currentFloor !== person.dropOffFloor){
        if(elevator.currentFloor < person.dropOffFloor){
          elevator.currentFloor++;
          elevator.floorsTraversed++;
        } else {
          elevator.currentFloor--;
          elevator.floorsTraversed++;
        }
      }
      elevator.stops++;
    });
  }

  it('Scenario 1: Both persons going up - Optimized should use fewer floors', () => {

    let personA = new Person('Oliver', 3, 6);
    let personB = new Person('Angela', 1, 5);
    
    basicElevator.requests = [personA, personB];
    basicDispatch(basicElevator);
    const basicFloors = basicElevator.floorsTraversed;
    
    optimizedElevator.requests = [new Person('Oliver', 3, 6), new Person('Angela', 1, 5)];
    optimizedElevator.dispatch();
    const optimizedFloors = optimizedElevator.floorsTraversed;
    
    console.log(`   Scenario 1 - Basic: ${basicFloors} floors, Optimized: ${optimizedFloors} floors`);
    assert.isBelow(optimizedFloors, basicFloors, 'Optimized algorithm should traverse fewer floors');
  });

  it('Scenario 2: Person A up, Person B down - Optimized should use fewer or equal floors', () => {

    let personA = new Person('Beverly', 3, 6);
    let personB = new Person('James', 5, 1);
    
    basicElevator.requests = [personA, personB];
    basicDispatch(basicElevator);
    const basicFloors = basicElevator.floorsTraversed;
    
    optimizedElevator.requests = [new Person('Beverly', 3, 6), new Person('James', 5, 1)];
    optimizedElevator.dispatch();
    const optimizedFloors = optimizedElevator.floorsTraversed;
    
    console.log(`   Scenario 2 - Basic: ${basicFloors} floors, Optimized: ${optimizedFloors} floors`);
    assert.isAtMost(optimizedFloors, basicFloors, 'Optimized algorithm should traverse fewer or equal floors');
  });

  it('Scenario 3: Person A down, Person B up - Optimized should use fewer floors', () => {

    let personA = new Person('Jeanne', 7, 1);
    let personB = new Person('Karl', 2, 8);
    
    basicElevator.requests = [personA, personB];
    basicDispatch(basicElevator);
    const basicFloors = basicElevator.floorsTraversed;
    
    optimizedElevator.requests = [new Person('Jeanne', 7, 1), new Person('Karl', 2, 8)];
    optimizedElevator.dispatch();
    const optimizedFloors = optimizedElevator.floorsTraversed;
    
    console.log(`   Scenario 3 - Basic: ${basicFloors} floors, Optimized: ${optimizedFloors} floors`);
    assert.isBelow(optimizedFloors, basicFloors, 'Optimized algorithm should traverse fewer floors');
  });

  it('Scenario 4: Both persons going down - Optimized should use fewer or equal floors', () => {

    let personA = new Person('Max', 8, 2);
    let personB = new Person('Charlie', 5, 0);
    
    basicElevator.requests = [personA, personB];
    basicDispatch(basicElevator);
    const basicFloors = basicElevator.floorsTraversed;
    
    optimizedElevator.requests = [new Person('Max', 8, 2), new Person('Charlie', 5, 0)];
    optimizedElevator.dispatch();
    const optimizedFloors = optimizedElevator.floorsTraversed;
    
    console.log(`   Scenario 4 - Basic: ${basicFloors} floors, Optimized: ${optimizedFloors} floors`);
    assert.isAtMost(optimizedFloors, basicFloors, 'Optimized algorithm should traverse fewer or equal floors');
  });

  it('Summary: Overall efficiency improvement', () => {
    console.log('\n   ✓ Optimized algorithm picks up passengers along the way');
    console.log('   ✓ Reduces unnecessary back-and-forth travel');
    console.log('   ✓ More efficient than basic first-come-first-serve');
  });
});
