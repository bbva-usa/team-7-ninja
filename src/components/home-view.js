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

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

const directionsService = new google.maps.DirectionsService();
const directionsRenderer = new google.maps.DirectionsRenderer();

class HomeView extends PageViewElement {
  static get styles() {
    return [
      SharedStyles
    ];
  }

  static get properties() {
    return {
      stops: { type: Array },
    };
  }

  constructor() {
    super();
    this.stops = [];
  }

  firstUpdated() {
    const map = new google.maps.Map(this.shadowRoot.querySelector('#map'), {
      center: { lat: 33.4757032, lng: -86.94038 },
      zoom: 13,
    });
    directionsRenderer.setMap(map);
  }

  updated(changedProperties) {
    if (!changedProperties.has('stops')) return;

    this._calculateAndDisplayRoute();
  }

  render() {
    return html`
      <style>

        #map {
          height: 100vh;
          margin-left: 300px;
        }
        @media (max-width: 460px) {
          #map {
            margin-left: 0;
            height: 70vh;
          }
        }
      </style>
      <div id="map"></div>
    `;
  }

  _calculateAndDisplayRoute() {
    const originObject = this.stops.shift();
    const destinationObject = this.stops.pop();
    console.log('origin', originObject);
    console.log('destination', destinationObject);
    console.log('in between stops', this.stops);
    const origin = new google.maps.LatLng(originObject.latitude, originObject.longitude);
    const destination = new google.maps.LatLng(destinationObject.latitude, destinationObject.longitude);

    directionsService.route(
      {
        origin,
        destination,
        waypoints: this._createWaypoints(this.stops),
        travelMode: 'DRIVING',
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        } else {
          window.alert(`irections request failed due to ${status}`);
        }
      },
    );
  }

  _createWaypoints(stops) {
    return stops.map((s) => ({ location: new google.maps.LatLng(s.latitude, originObject.longitude), stopover: true }));
  }
}

window.customElements.define('home-view', HomeView);
