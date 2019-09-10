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

class HomeView extends PageViewElement {
  static get styles() {
    return [
      SharedStyles
    ];
  }

  static get properties() {
    return {
      appTitle: { type: String },
      _page: { type: String },
    };
  }

  constructor() {
    super();
    this._page = 'djknsflkhasd';
  }

  firstUpdated() {
    console.log(this.shadowRoot.querySelector('#map'));

    tomtom.L.map('map', {
      key: 'xZxOt6tG6faICTemfXGdFM4axfQvDPv6',
      source: 'vector',
      basePath: '../../sdk',
    });
  }

  render() {
    return html`
      <div id="map"></div>
    `;
  }
}

window.customElements.define('home-view', HomeView);
