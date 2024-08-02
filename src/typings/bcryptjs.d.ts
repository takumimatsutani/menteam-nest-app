declare module 'bcryptjs' {
  export function genSaltSync(saltRounds?: number): string;
  export function hashSync(data: string, saltOrRounds: string | number): string;
  export function compareSync(data: string, encrypted: string): boolean;
  export function genSalt(saltRounds?: number): Promise<string>;
  export function hash(
    data: string,
    saltOrRounds: string | number,
  ): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
}
