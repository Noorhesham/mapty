'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  description;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _getDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // prettier-ignore
    this.description=`${this.type.replace(this.type[0],this.type[0].toUpperCase())} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
}
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._getDescription();
    this._calcpace();
  }
  type = 'running';
  _calcpace() {
    return (this.pace = this.duration / this.distance);
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._getDescription();
    this._calcspeed();
  }
  type = 'cycling';
  _calcspeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  workouts = [];
  markers = [];
  mapZoom=15;
  i=0;
  constructor() {
    this._getPosition();
    // this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click',this._moveToMarker.bind(this))
  }
  /*i will get the position if got then we will implelemnt a function that will display the map and add event listner to it
if we click on the map we will show the hidden form if we submit the hidden form we will make new workout */
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadmap.bind(this), () =>
        alert('could not find location')
      );
    }
  }
  _loadmap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.mapZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showform.bind(this));
    this.workouts.forEach(workout=>this._render_workout_marker(workout))
  }
  _showform(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    let workout;
    e.preventDefault();
    //get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = { lat, lng };
    //check if valid
    const validation = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allpositive = (...inputs) => inputs.every(input => input > 0);

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!validation(distance, duration, cadence) ||!allpositive(distance, duration, cadence))return alert('input has to be positive number');
      workout = new Running(coords, distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (!validation(distance, duration, elevationGain) ||!allpositive(distance, duration))return alert('input has to be positive number');
      workout = new Cycling(coords, distance, duration, elevationGain);
    }

    this.workouts.push(workout);
    this._render_workout_marker(workout);
    this._renederWorkout(workout);
    this.hideForm();
    // this._setLocalStorage();
    // document.querySelectorAll('.workout').forEach(work=>{
    //   work.addEventListener('click',()=>{
    //   })
    // })
    //DELETE WORKOUT
    const del=document.querySelector('.workout__delete');
    const delete_workout=()=>{
      // const delwork=this.workouts.find(workout=>workout.id===del.parentElement.dataset.id);
      // const index=this.workouts.indexOf(delwork)
      // this.workouts.splice(index,1);
      // localStorage.setItem('workout',JSON.stringify(delwork))
      // localStorage.removeItem('workout')
      // this.workouts.splice(delwork)
      del.parentElement.remove();
      this.#map.removeLayer(this.markers[Number(del.dataset.del)]);
    }
    del.addEventListener('click',delete_workout.bind(this));
    // prettier-ignore
  }
  _render_workout_marker(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`)
      .openPopup();
    this.markers.push(marker);
  }
  _renederWorkout(workout) {
    let html = `
  <li class="workout workout--${workout.type}" data-id="${workout.id}">
  <h2 class="workout__title">${workout.description}</h2>
  <span class="workout__delete" data-del="${this.i}">Remove workout 🗑</span>
  <div class="workout__details">
    <span class="workout__icon">${
      workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
    }</span>
    <span class="workout__value">${workout.distance}</span>
    <span class="workout__unit">${
      workout.type === 'running' ? 'km' : 'min/km'
    }</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⏱</span>
    <span class="workout__value">${workout.duration}</span>
    <span class="workout__unit">min</span>
  </div>`;

    if (workout.type === 'running')
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
  `;

    if (workout.type === 'cycling')
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>
  `;
    form.insertAdjacentHTML('afterend', html);
    this.i++;
  }
  hideForm(){
    form.style.display='none';
    form.classList.add('hidden');
    setTimeout(()=>form.style.display='grid',1000)
    inputCadence.vlaue =inputDistance.value =inputDuration.value =inputElevation.value = '';
  }
  _moveToMarker(e){
  const workoutEl=e.target.closest('.workout');
  if(!workoutEl) return;
  const workout=this.workouts.find(work=>work.id===workoutEl.dataset.id)
  this.#map.setView(workout.coords,this.mapZoom,{animate:true,pan:{duration:1}});
  }
  // _setLocalStorage(){
  // localStorage.setItem('workouts',JSON.stringify(this.workouts))
  // }
  // _getLocalStorage(){
  //   const data=JSON.parse(localStorage.getItem('workouts'));
  //   if(!data)return;
  //   this.workouts=data;
  //   this.workouts.forEach(workout=>this._renederWorkout(workout))
  // }
  // _clear(){
  //   localStorage.clear()
  // }

}

const app = new App();
