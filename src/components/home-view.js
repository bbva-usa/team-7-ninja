/* eslint-disable no-alert */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html } from 'lit-element';
import { PageViewElement } from './page-view-element.js';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import '@polymer/paper-tabs/paper-tabs';
import '@polymer/paper-tabs/paper-tab';

const directionsService = new google.maps.DirectionsService();
let directionsRenderer;

let map;

class HomeView extends PageViewElement {
  static get styles() {
    return [
      SharedStyles
    ];
  }

  static get properties() {
    return {
      route: { type: Array },
      _currentSwitch: { type: String },
    };
  }

  constructor() {
    super();
    this.route = {};
  }

  firstUpdated() {
    map = new google.maps.Map(this.shadowRoot.querySelector('#map'), {
      center: { lat: 33.4757032, lng: -86.94038 },
      zoom: 13,
    });
    const infoWindow = new google.maps.InfoWindow();

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
  
        infoWindow.setPosition(pos);
        infoWindow.setContent('Location found.');
        infoWindow.open(map);
        console.log(pos);
        map.setCenter(pos);
      }, () => {
        console.error('Error Getting Lcation');
      });
    } else {
      console.log('errororo');
    }

    installMediaQueryWatcher(`(min-width: 460px)`,
      (matches) => {
        const dropOffSwitch = this.shadowRoot.querySelector('#drop-off-switch');
        map.controls[matches ? google.maps.ControlPosition.TOP_CENTER : google.maps.ControlPosition.LEFT_TOP].push(dropOffSwitch);
      });
  }

  updated(changedProperties) {
    if (!changedProperties.has('route')) return;

    this._calculateRoutes('pick_up');
  }

  render() {
    return html`
      <style>
        :host {
          --paper-tab-ink: var(--app-secondary-color);
          --paper-tabs-selection-bar-color: var(--app-secondary-color);
        }
        #map {
          height: 100vh;
          margin-left: 340px;
        }

        paper-tabs {
          background-color: white;
          color: black;
          margin-top: 3%;
        }

        @media (max-width: 460px) {
          #map {
            margin-left: 0;
            height: 60vh;
          }

          paper-tabs {
            margin-left: 6%;
          }
        }
      </style>
      <div id="map"></div>
      <div id="drop-off-switch">
        <paper-tabs
          selected="0"
          @selected-changed="${this._optionChanged}">
          <paper-tab>Pick Up</paper-tab>
          <paper-tab>Drop Off</paper-tab>
        </paper-tabs>
      </div>
    `;
  }

  _optionChanged() {
    this._calculateRoutes(this._currentSwitch === 'pick_up' ? 'drop_off' : 'pick_up');
  }

  _calculateRoutes(type) {
    if (!this.route[type]) return;

    this._currentSwitch = type;

    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      directionsRenderer = null;
    }

    directionsRenderer = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: type === 'pick_up' ? '#332266' : '#9b8dc4',
        strokeOpacity: 0.6,
        strokeWeight: 5,
      },
      suppressMarkers: true,
    });

    directionsRenderer.setMap(map);
    const markerArray = [];
    const stepDisplay = new google.maps.InfoWindow;
    const originalRoute = JSON.parse(JSON.stringify(this.route));
    const originObject = this.route[type].shift();
    const destinationObject = this.route[type].pop();
    const origin = new google.maps.LatLng(originObject.latitude, originObject.longitude);
    const destination = new google.maps.LatLng(destinationObject.latitude, destinationObject.longitude);
    directionsService.route(
      {
        origin,
        destination,
        waypoints: this._createWaypoints(this.route[type]),
        travelMode: 'DRIVING',
        optimizeWaypoints: true,
      },
      (response, status) => {
        if (status === 'OK') {
          this.showTime(response, markerArray, stepDisplay, originalRoute, type);
          directionsRenderer.setDirections(response);
        } else {
          window.alert(`Directions request failed due to ${status}`);
        }
      },
    );
  }

  showTime(directionResult, markerArray, stepDisplay, originalRoute, type) {
    // For each step, place a marker, and add the text to the marker's infowindow.
    // Also attach the marker to an array so we can keep track of it and remove it
    // when calculating new routes.
    const myRoute = directionResult.routes[0].legs;
    for (var i = 0; i < myRoute.length; i++) {
      const marker = markerArray[i] = markerArray[i] || new google.maps.Marker;
      marker.setMap(map);
      marker.setPosition(myRoute[i].start_location);
      this.attachInstructionText(stepDisplay, marker, this.createPopupText(originalRoute[type][i].name, type, originalRoute[type][i].time));
    }
  }

  createPopupText(name, type, time) {
    return `${name}<br>
    ${type === 'pick_up' ? 'Pick Up' : 'Drop Off'}: ${time}
    `;
  }

  attachInstructionText(stepDisplay, marker, text) {
    google.maps.event.addListener(marker, 'click', () => {
      // Open an info window when the marker is clicked on, containing the text
      // of the step.
      stepDisplay.setContent(text);
      stepDisplay.open(map, marker);
    });
  }

  _createWaypoints(stops) {
    return stops.map((s) => ({ location: new google.maps.LatLng(s.latitude, s.longitude), stopover: true }));
  }
}

window.customElements.define('home-view', HomeView);