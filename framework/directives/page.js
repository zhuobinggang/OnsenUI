/*
Copyright 2013-2014 ASIAL CORPORATION

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

/**
 * @ngdoc directive
 * @id page
 * @name ons-page
 * @description
 * Should be used as root component of each page. The content inside page component is not scrollable. If you need scroll behavior, you can put inside this component.
 * @demoURL
 * OnsenUI/demo/page/
 */
(function() {
  'use strict';

  var module = angular.module('onsen');

  function firePageInitEvent(pageContainer) {
    function findPageDOM() {
      if (angular.element(pageContainer).hasClass('page')) {
        return pageContainer;
      }

      var result = pageContainer.querySelector('.page');

      if (!result) {
        throw new Error('An element of "page" class is not found.');
      }

      return result;
    }
    
    var event = document.createEvent('HTMLEvents');    
    event.initEvent('pageinit', true, true);
    findPageDOM().dispatchEvent(event);    
  }

  module.directive('onsPage', function($onsen, $timeout) {
    function controller($scope, $element) {

      /* jshint validthis:true */

      this.registeredToolbarElement = false;
      this.registeredBottomToolbarElement = false;

      this.nullElement = window.document.createElement('div');

      this.toolbarElement = angular.element(this.nullElement);
      this.bottomToolbarElement = angular.element(this.nullElement);

      /**
       * Register toolbar element to this page.
       *
       * @param {jqLite} element
       */
      this.registerToolbar = function(element) {
        if (this.registeredToolbarElement) {
          throw new Error('This page\'s toolbar is already registered.');
        }
        
        element.remove();
        var statusFill = $element[0].querySelector('.page__status-bar-fill');
        if (statusFill) {
          angular.element(statusFill).after(element);
        } else {
          $element.prepend(element);
        }

        this.toolbarElement = element;
        this.registeredToolbarElement = true;
      };

      /**
       * Register toolbar element to this page.
       *
       * @param {jqLite} element
       */
      this.registerBottomToolbar = function(element) {
        if (this.registeredBottomToolbarElement) {
          throw new Error('This page\'s bottom-toolbar is already registered.');
        }

        element.remove();

        this.bottomToolbarElement = element;
        this.registeredBottomToolbarElement = true;

        var fill = angular.element(document.createElement('div'));
        fill.addClass('page__bottom-bar-fill');
        fill.css({width: '0px', height: '0px'});

        $element.prepend(fill);
        $element.append(element);
      };

      /**
       * @return {Boolean}
       */
      this.hasToolbarElement = function() {
        return this.registeredToolbarElement;
      };

      /**
       * @return {Boolean}
       */
      this.hasBottomToolbarElement = function() {
        return this.registeredBottomToolbarElement;
      };

      /**
       * @return {HTMLElement}
       */
      this.getContentElement = function() {
        for (var i = 0; i < $element.length; i++) {
          if ($element[i].querySelector) {
            var content = $element[i].querySelector('.page__content');
            if (content) {
              return content;
            }
          }
        }
        throw Error('fail to get ".page__content" element.');
      };

      /**
       * @return {HTMLElement}
       */
      this.getToolbarElement = function() {
        return this.toolbarElement[0] || this.nullElement;
      };

      /**
       * @return {HTMLElement}
       */
      this.getBottomToolbarElement = function() {
        return this.bottomToolbarElement[0] || this.nullElement;
      };

      /**
       * @return {HTMLElement}
       */
      this.getToolbarLeftItemsElement = function() {
        return this.toolbarElement[0].querySelector('.left') || this.nullElement;
      };

      /**
       * @return {HTMLElement}
       */
      this.getToolbarCenterItemsElement = function() {
        return this.toolbarElement[0].querySelector('.center') || this.nullElement;
      };

      /**
       * @return {HTMLElement}
       */
      this.getToolbarRightItemsElement = function() {
        return this.toolbarElement[0].querySelector('.right') || this.nullElement;
      };

      /**
       * @return {HTMLElement}
       */
      this.getToolbarBackButtonLabelElement = function() {
        return this.toolbarElement[0].querySelector('ons-back-button .back-button__label') || this.nullElement;
      };

      $scope.$on('$destroy', function(){
        this.toolbarElement = null;
        this.nullElement = null;
        this.bottomToolbarElement = null;
      }.bind(this));

    }

    return {
      restrict: 'E',
      controller: controller,

      // NOTE: This element must coexists with ng-controller.
      // Do not use isolated scope and template's ng-transclde.
      transclude: true,
      scope: true,

      compile: function(element) {
        if ($onsen.isWebView() && $onsen.isIOS7Above()) {
          // Adjustments for IOS7
          var fill = angular.element(document.createElement('div'));
          fill.addClass('page__status-bar-fill');
          fill.css({width: '0px', height: '0px'});
          element.prepend(fill);
        }

        return {

          pre: function(scope, element, attrs, controller, transclude) {
            var modifierTemplater = $onsen.generateModifierTemplater(attrs);
            element.addClass('page ' + modifierTemplater('page--*'));

            transclude(scope, function(clonedElement) {
              var content = angular.element('<div class="page__content ons-page-inner"></div>');
              content.addClass(modifierTemplater('page--*__content'));
              content.css({zIndex: 0});
              element.append(content);

              if (Modernizr.csstransforms3d) {
                content.append(clonedElement);
              }  else {

                var wrapper = angular.element('<div></div>');
                content.append(wrapper);
                wrapper.append(clonedElement);

                // IScroll for Android2
                var scroller = new IScroll(content[0], {
                  momentum: true,
                  bounce: true,
                  hScrollbar: false,
                  vScrollbar: false,
                  preventDefault: false
                });

                var offset = 10;
                scroller.on('scrollStart', function(e) {
                  var scrolled = scroller.y - offset;
                  if (scrolled < (scroller.maxScrollY + 40)) {
                    // TODO: find a better way to know when content is upated so we can refresh
                    scroller.refresh();
                  }
                });
              }
            });


          },

          post: function(scope, element, attrs) {
            firePageInitEvent(element[0]);
          }
        };
      }
    };
  });
})();
