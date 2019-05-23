export default {
  get mongoId() {
    return (value) => value === undefined || value === null || /^[0-9a-f]{24}$/.test(value)
  },
}
