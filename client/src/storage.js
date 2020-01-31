export default function Storage() {
  function lsTest() {
    const test = 'test';
    try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  if (lsTest() === true) {
    return localStorage;
  }
  return {
    setItem() {},
    getITem() {},
    removeItem() {},
  };
}
