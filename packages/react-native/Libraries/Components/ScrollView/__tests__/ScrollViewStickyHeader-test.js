/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeAnimatedHelper from '../../../../src/private/animated/NativeAnimatedHelper';
import Animated from '../../../Animated/Animated';
import View from '../../View/View';
import ScrollViewStickyHeader from '../ScrollViewStickyHeader';
import nullthrows from 'nullthrows';
import * as React from 'react';
import TestRenderer from 'react-test-renderer';

// Jest host refs are not Fabric public instances, so enable the Fabric path.
jest.mock(
  '../../../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstanceUtils',
  () => ({
    isPublicInstance: () => true,
  }),
);

describe('ScrollViewStickyHeader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates its Fabric transform while sticky and after returning to its layout position', async () => {
    const scrollAnimatedValue = new Animated.Value(0, {
      useNativeDriver: true,
    });
    let renderer;

    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <ScrollViewStickyHeader
          nativeID="sticky-header"
          nextHeaderLayoutY={null}
          onLayout={() => {}}
          scrollAnimatedValue={scrollAnimatedValue}
          inverted={false}
          scrollViewHeight={null}>
          <View style={{height: 20}} />
        </ScrollViewStickyHeader>,
        {
          createNodeMock: () => ({__nativeTag: 2, setNativeProps: () => {}}),
        },
      );
    });

    const header = () =>
      nullthrows(
        renderer.root
          .findAllByProps({nativeID: 'sticky-header'})
          .filter(node => node.props.style != null)
          .pop(),
      );
    await TestRenderer.act(async () => {
      header().props.onLayout({
        nativeEvent: {layout: {y: 100, height: 20}},
      });
    });

    const animatedHeader = nullthrows(
      nullthrows(renderer)
        .root.findAllByProps({nativeID: 'sticky-header'})
        .find(node => Array.isArray(node.props.style)),
    );
    const animatedTranslateY =
      animatedHeader.props.style[2].transform[0].translateY;
    const animatedTag = animatedTranslateY.__getNativeTag();
    const emitNativeTranslation = (value: number) => {
      NativeAnimatedHelper.nativeEventEmitter.emit('onAnimatedValueUpdate', {
        tag: animatedTag,
        value,
      });
    };

    await TestRenderer.act(async () => {
      emitNativeTranslation(0);
      emitNativeTranslation(50);
      jest.advanceTimersByTime(65);
    });
    expect(header().props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({transform: [{translateY: 50}]}),
      ]),
    );

    await TestRenderer.act(async () => {
      emitNativeTranslation(0);
      jest.advanceTimersByTime(65);
    });
    expect(header().props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({transform: [{translateY: 0}]}),
      ]),
    );
  });
});
