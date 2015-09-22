// Copyright 2015, EMC, Inc.

'use strict';
/* global describe, it, expect, before, after */
/* eslint-disable no-unused-expressions */

import React from 'react'; // eslint-disable-line no-unused-vars

import TestWrapper from 'common-web-ui/views/TestWrapper';
import <%= file %> from '../<%= file %>';

describe('<%= name %> <%= file %>', function() {

  describe('component', function() {
    before(function(done) {
      this.wrapper = TestWrapper.testRender(<%= file %>, {
        children: 'No content'
      }, (err, component) => {
        this.subject = component;
        done(err);
      }, true);
    });

    after(function(done) {
      this.wrapper.cleanup(done);
    });

    it('can be rendered.', function() {
      expect(this.wrapper).to.be.ok;
      expect(this.subject).to.be.ok;
      expect(React.findDOMNode(this.subject)).to.be.ok;
    });
  });

});
