import { validateAndNormalizeLabel } from '../src'

describe('validateAndNormalizeLabel', function () {
  test('should throw error if label is empty', function () {
    expect(() => validateAndNormalizeLabel('')).toThrowError('Label cannot be empty')
  })

  test('should throw error if label contains a dot', function () {
    expect(() => validateAndNormalizeLabel('label.with.dot')).toThrowError('Label cannot contain a dot')
  })

  test('should throw error if label starts with a hyphen', function () {
    expect(() => validateAndNormalizeLabel('-label')).toThrowError('Failed to validate -label')
  })

  test('should return normalized label', function () {
    expect(validateAndNormalizeLabel('label')).toEqual('label')
    expect(validateAndNormalizeLabel('xn--c1yn36f')).toEqual('點看')
    expect(validateAndNormalizeLabel('label-with-hyphen')).toEqual('label-with-hyphen')
    expect(() => validateAndNormalizeLabel('label with space')).toThrowError('Illegal char')
    expect(() => validateAndNormalizeLabel('label_with_underscore')).toThrowError('Illegal char _')
    expect(validateAndNormalizeLabel('label👍🏾')).toBe('label👍🏾')
  })
})
