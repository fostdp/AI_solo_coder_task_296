import { EventBus } from '../public/modules/EventBus.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  test('should create instance', () => {
    expect(eventBus).toBeInstanceOf(EventBus);
  });

  test('should register listener and emit event', () => {
    const callback = jest.fn();
    eventBus.on('test-event', callback);
    
    eventBus.emit('test-event', 'data');
    
    expect(callback).toHaveBeenCalledWith('data');
  });

  test('should register multiple listeners for same event', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    eventBus.on('test-event', callback1);
    eventBus.on('test-event', callback2);
    
    eventBus.emit('test-event', 'data');
    
    expect(callback1).toHaveBeenCalledWith('data');
    expect(callback2).toHaveBeenCalledWith('data');
  });

  test('should remove listener', () => {
    const callback = jest.fn();
    const unsubscribe = eventBus.on('test-event', callback);
    
    unsubscribe();
    eventBus.emit('test-event', 'data');
    
    expect(callback).not.toHaveBeenCalled();
  });

  test('should call once listener only once', () => {
    const callback = jest.fn();
    eventBus.once('test-event', callback);
    
    eventBus.emit('test-event', 'data1');
    eventBus.emit('test-event', 'data2');
    
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('data1');
  });

  test('should return correct listener count', () => {
    eventBus.on('test-event', () => {});
    eventBus.on('test-event', () => {});
    eventBus.once('test-event', () => {});
    
    expect(eventBus.listenerCount('test-event')).toBe(3);
  });

  test('should clear all listeners', () => {
    eventBus.on('event1', () => {});
    eventBus.on('event2', () => {});
    
    eventBus.clear();
    
    expect(eventBus.listenerCount('event1')).toBe(0);
    expect(eventBus.listenerCount('event2')).toBe(0);
  });

  test('should handle errors in listeners gracefully', () => {
    const errorCallback = () => { throw new Error('Test error'); };
    const normalCallback = jest.fn();
    
    eventBus.on('test-event', errorCallback);
    eventBus.on('test-event', normalCallback);
    
    expect(() => eventBus.emit('test-event')).not.toThrow();
    expect(normalCallback).toHaveBeenCalled();
  });
});
