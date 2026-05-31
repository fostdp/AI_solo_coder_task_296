import { WindField } from '../public/modules/WindField.js';

describe('WindField', () => {
  let windField;

  beforeEach(() => {
    windField = new WindField();
  });

  test('should create instance with default params', () => {
    expect(windField).toBeInstanceOf(WindField);
    expect(windField.params.strength).toBe(0);
    expect(windField.params.speed).toBe(1);
    expect(windField.params.direction).toBe(0);
  });

  test('should update params correctly', () => {
    windField.updateParams({
      windStrength: 20,
      windSpeed: 2,
      windDirection: 45
    });
    
    expect(windField.params.strength).toBe(20);
    expect(windField.params.speed).toBe(2);
    expect(windField.params.direction).toBe(45);
  });

  test('should update and return wind force', () => {
    windField.updateParams({ windStrength: 10 });
    
    const result = windField.update(16);
    
    expect(result.force).toBeDefined();
    expect(result.totalWind).toBeDefined();
    expect(typeof result.force).toBe('number');
    expect(typeof result.totalWind).toBe('number');
  });

  test('should add harmonics correctly', () => {
    const initialCount = windField.harmonics.length;
    
    windField.addHarmonic(4, 0.5, 0.3);
    
    expect(windField.harmonics.length).toBe(initialCount + 1);
    expect(windField.harmonics[initialCount]).toEqual({
      frequency: 4,
      amplitude: 0.5,
      phase: 0.3
    });
  });

  test('should return current force after update', () => {
    windField.updateParams({ windStrength: 15 });
    windField.update(16);
    
    const force = windField.getCurrentForce();
    
    expect(typeof force).toBe('number');
  });

  test('should return position-based force', () => {
    windField.updateParams({ windStrength: 10 });
    windField.update(16);
    
    const force = windField.getForceAtPosition(100, 200);
    
    expect(typeof force).toBe('number');
  });

  test('should reset all state', () => {
    windField.updateParams({ windStrength: 20 });
    windField.addHarmonic(5, 0.5, 0);
    windField.update(1000);
    
    windField.reset();
    
    expect(windField.params.strength).toBe(20);
    expect(windField.currentForce).toBe(0);
    expect(windField.time).toBe(0);
  });

  test('should set strength directly', () => {
    windField.setStrength(30);
    expect(windField.params.strength).toBe(30);
  });

  test('should set speed directly', () => {
    windField.setSpeed(3);
    expect(windField.params.speed).toBe(3);
  });

  test('should set direction directly', () => {
    windField.setDirection(90);
    expect(windField.params.direction).toBe(90);
  });
});
