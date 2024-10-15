const defaultName = 'abc';
class testModule {
  name!: string;

  getName = () => this.name;
  setName = (name: string) => (this.name = name || defaultName);
}

export default new testModule();
