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
      route: { type: Array },
    };
  }

  constructor() {
    super();
    this.route = {};
  }

  firstUpdated() {
    const map = new google.maps.Map(this.shadowRoot.querySelector('#map'), {
      center: { lat: 33.4757032, lng: -86.94038 },
      zoom: 13,
    });
    directionsRenderer.setMap(map);
  }

  updated(changedProperties) {
    if (!changedProperties.has('route')) return;

    this._calculateRoutes('pick_up');
    this._calculateRoutes('drop_off');
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

  _calculateRoutes(type) {
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
