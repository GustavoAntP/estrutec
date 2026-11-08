function cpfValido(cpf) {
  const numeros = String(cpf).replace(/\D/g, "");

  if (numeros.length !== 11) {
    return false;
  }

  // CPFs com todos os dígitos iguais são sempre inválidos (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(numeros)) {
    return false;
  }

  const calcularDigitoVerificador = (base) => {
    let soma = 0;
    let peso = base.length + 1;

    for (const digito of base) {
      soma += Number(digito) * peso;
      peso--;
    }

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  };

  const primeirosNoveDigitos = numeros.slice(0, 9);
  const primeiroDigitoVerificador = calcularDigitoVerificador(
    primeirosNoveDigitos
  );

  const primeirosDezDigitos =
    primeirosNoveDigitos + String(primeiroDigitoVerificador);
  const segundoDigitoVerificador = calcularDigitoVerificador(
    primeirosDezDigitos
  );

  return (
    Number(numeros[9]) === primeiroDigitoVerificador &&
    Number(numeros[10]) === segundoDigitoVerificador
  );
}

function cnpjValido(cnpj) {
  const numeros = String(cnpj).replace(/\D/g, "");

  if (numeros.length !== 14) {
    return false;
  }

  // CNPJs com todos os dígitos iguais são sempre inválidos (ex: 11.111.111/1111-11)
  if (/^(\d)\1{13}$/.test(numeros)) {
    return false;
  }

  const calcularDigitoVerificador = (base, pesos) => {
    let soma = 0;

    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * pesos[i];
    }

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  };

  const pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const primeirosDozeDigitos = numeros.slice(0, 12);
  const primeiroDigitoVerificador = calcularDigitoVerificador(
    primeirosDozeDigitos,
    pesosPrimeiroDigito
  );

  const primeirosTrezeDigitos =
    primeirosDozeDigitos + String(primeiroDigitoVerificador);
  const segundoDigitoVerificador = calcularDigitoVerificador(
    primeirosTrezeDigitos,
    pesosSegundoDigito
  );

  return (
    Number(numeros[12]) === primeiroDigitoVerificador &&
    Number(numeros[13]) === segundoDigitoVerificador
  );
}

module.exports = {
  cpfValido,
  cnpjValido,
};