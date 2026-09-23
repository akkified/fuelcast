// Official in-memory mock so modules that import AsyncStorage can be unit-tested.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
