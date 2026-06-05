export const getDevFlag = (name: string) =>
	(window as any)[Symbol.for(name)] || window.sessionStorage[name];
