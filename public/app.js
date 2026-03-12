
import Elevator from '../elevator.js';
import Person from '../person.js';

const API_URL = 'http://localhost:3000/api';

let elevator = new Elevator();
let isRunning = false;
const TOTAL_FLOORS = 10;

function initBuilding() {
  const building = document.getElementById('building');
  building.innerHTML = '';
  
  for (let i = TOTAL_FLOORS; i >= 0; i--) {
    const floor = document.createElement('div');
    floor.className = 'floor';
    floor.id = `floor-${i}`;
    floor.innerHTML = `
      <div class="floor-number">Floor ${i}</div>
      <div class="floor-content" id="floor-content-${i}"></div>
    `;
    building.appendChild(floor);
  }
  
  updateElevatorPosition();
}

function updateElevatorPosition() {

  document.querySelectorAll('.elevator').forEach(el => el.remove());
  
  const currentFloorContent = document.getElementById(`floor-content-${elevator.currentFloor}`);
  const elevatorEl = document.createElement('div');
  elevatorEl.className = 'elevator';
  elevatorEl.textContent = `🛗 Elevator (${elevator.riders.length} riders)`;
  currentFloorContent.appendChild(elevatorEl);
}

function updateStats() {
  document.getElementById('currentFloor').textContent = elevator.currentFloor;
  document.getElementById('floorsTraversed').textContent = elevator.floorsTraversed;
  document.getElementById('totalStops').textContent = elevator.stops;
  document.getElementById('ridersCount').textContent = elevator.riders.length;
}

function updateRequestsList() {
  const list = document.getElementById('requestsList');
  list.innerHTML = '';
  
  elevator.requests.forEach((person, index) => {
    const li = document.createElement('li');
    li.textContent = `${person.name}: Floor ${person.currentFloor} → ${person.dropOffFloor}`;
    list.appendChild(li);
  });
  
  if (elevator.requests.length === 0) {
    list.innerHTML = '<li style="border: none; color: #999;">No pending requests</li>';
  }
}

function updateRidersList() {
  const list = document.getElementById('ridersList');
  list.innerHTML = '';
  
  elevator.riders.forEach((person, index) => {
    const li = document.createElement('li');
    li.textContent = `${person.name} → Floor ${person.dropOffFloor}`;
    list.appendChild(li);
  });
  
  if (elevator.riders.length === 0) {
    list.innerHTML = '<li style="border: none; color: #999;">No riders</li>';
  }
}

function updatePeopleVisualization() {

  document.querySelectorAll('.person').forEach(el => el.remove());
  
  elevator.requests.forEach(person => {
    const floorContent = document.getElementById(`floor-content-${person.currentFloor}`);
    const personEl = document.createElement('div');
    personEl.className = 'person waiting';
    personEl.textContent = `${person.name} (→${person.dropOffFloor})`;
    floorContent.appendChild(personEl);
  });
}

window.addRequest = async function() {
  const name = document.getElementById('personName').value.trim();
  const currentFloor = parseInt(document.getElementById('currentFloorInput').value);
  const dropOffFloor = parseInt(document.getElementById('dropOffFloor').value);
  
  if (!name) {
    alert('Please enter a person name');
    return;
  }
  
  if (currentFloor === dropOffFloor) {
    alert('Current floor and drop-off floor must be different');
    return;
  }
  
  const person = new Person(name, currentFloor, dropOffFloor);
  
  try {

    const response = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person)
    });
    
    if (response.ok) {
      const data = await response.json();
      elevator.requests = data.requests.map(r => new Person(r.name, r.currentFloor, r.dropOffFloor));
    } else {
      throw new Error('API request failed');
    }
  } catch (error) {

    console.log('API unavailable, using local storage');
    elevator.requests.push(person);
  }
  
  updateRequestsList();
  updatePeopleVisualization();
  
  document.getElementById('personName').value = '';
  document.getElementById('currentFloorInput').value = '0';
  document.getElementById('dropOffFloor').value = '5';
};

window.startElevator = async function() {
  if (isRunning) {
    alert('Elevator is already running');
    return;
  }
  
  if (elevator.requests.length === 0) {
    alert('No requests to process');
    return;
  }
  
  isRunning = true;
  
  const originalMoveUp = elevator.moveUp.bind(elevator);
  const originalMoveDown = elevator.moveDown.bind(elevator);
  
  elevator.moveUp = async function() {
    originalMoveUp();
    updateElevatorPosition();
    updateStats();
    await sleep(500); 
  };
  
  elevator.moveDown = async function() {
    originalMoveDown();
    updateElevatorPosition();
    updateStats();
    await sleep(500); 
  };
  
  const originalHasPickup = elevator.hasPickup.bind(elevator);
  const originalHasDropoff = elevator.hasDropoff.bind(elevator);
  
  elevator.hasPickup = async function() {
    originalHasPickup();
    updateRequestsList();
    updateRidersList();
    updatePeopleVisualization();
    await sleep(300);
  };
  
  elevator.hasDropoff = async function() {
    originalHasDropoff();
    updateRidersList();
    await sleep(300);
  };
  
  try {
    await runDispatchWithAnimation();
    alert('Elevator completed all requests!');
  } catch (error) {
    console.error('Error during dispatch:', error);
  }
  
  isRunning = false;
  
  await syncWithAPI();
};

async function runDispatchWithAnimation() {
  while (elevator.requests.length > 0 || elevator.riders.length > 0) {
    const firstRequest = elevator.requests[0];
    
    if (!firstRequest && elevator.riders.length === 0) {
      break;
    }
    
    if (firstRequest) {
      await processRequestsWithAnimation(firstRequest);
    }
  }
  
  if (elevator.checkReturnToLoby()) {
    await returnToLobyWithAnimation();
  }
}

async function processRequestsWithAnimation(firstRequest) {
  const targetFloor = firstRequest.dropOffFloor;
  const direction = targetFloor > elevator.currentFloor ? 1 : -1;
  
  while (elevator.requests.length > 0 || elevator.riders.length > 0) {
    if (elevator.hasStop()) {
      if (elevator.requests.some(r => r.currentFloor === elevator.currentFloor)) {
        await elevator.hasPickup();
        elevator.stops++;
        updateStats();
      }
      if (elevator.riders.some(r => r.dropOffFloor === elevator.currentFloor)) {
        await elevator.hasDropoff();
        elevator.stops++;
        updateStats();
      }
    }
    
    if (elevator.requests.length === 0 && elevator.riders.length === 0) {
      break;
    }
    
    const nextRequest = elevator.requests[0];
    const nextRider = elevator.riders[0];
    
    if (nextRequest && !nextRider) {
      if (elevator.currentFloor === nextRequest.currentFloor) {
        continue;
      }
      if (elevator.currentFloor < nextRequest.currentFloor) {
        await elevator.moveUp();
      } else {
        await elevator.moveDown();
      }
    } else if (nextRider && !nextRequest) {
      if (elevator.currentFloor === nextRider.dropOffFloor) {
        continue;
      }
      if (elevator.currentFloor < nextRider.dropOffFloor) {
        await elevator.moveUp();
      } else {
        await elevator.moveDown();
      }
    } else if (nextRequest && nextRider) {
      if (direction === 1) {
        await elevator.moveUp();
      } else {
        await elevator.moveDown();
      }
    } else {
      break;
    }
  }
}

async function returnToLobyWithAnimation() {
  while (elevator.currentFloor > Elevator.LOBBY_FLOOR) {
    await elevator.moveDown();
  }
}

window.resetElevator = async function() {
  if (isRunning) {
    alert('Cannot reset while elevator is running');
    return;
  }
  
  elevator.reset();
  elevator.requests = [];
  
  try {
    await fetch(`${API_URL}/reset`, { method: 'POST' });
  } catch (error) {
    console.log('API unavailable for reset');
  }
  
  updateElevatorPosition();
  updateStats();
  updateRequestsList();
  updateRidersList();
  updatePeopleVisualization();
};

async function syncWithAPI() {
  try {
    const response = await fetch(`${API_URL}/elevator`);
    if (response.ok) {
      const data = await response.json();

      console.log('Synced with API:', data);
    }
  } catch (error) {
    console.log('API sync failed');
  }
}

async function checkAPIStatus() {
  const statusDot = document.getElementById('apiStatus');
  const statusText = document.getElementById('apiStatusText');
  
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'API Online';
    } else {
      throw new Error('API not responding');
    }
  } catch (error) {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'API Offline (Local Mode)';
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', () => {
  initBuilding();
  updateStats();
  updateRequestsList();
  updateRidersList();
  checkAPIStatus();
  
  setInterval(checkAPIStatus, 5000);
});
