/* eslint-disable import/prefer-default-export */

import { Fetcher } from './services-fetcher';

export class Services {
  /** ---- STATIC MEMBERS - RETURN INSTANCE OF FETCHER ---- */

  static get routes() {
    return new Fetcher('routes');
  }

  static get schools() {
    return new Fetcher('schools');
  }
}
