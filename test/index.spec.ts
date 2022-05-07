import { assert } from 'chai';
import parse from '../src/index';

const queries = [{
  rsql: 'city=="Shanghai"',
  prisma: {
    city: {
      equals: 'Shanghai'
    }
  }
}, {
  rsql: 'product!="T1"',
  prisma: {
    product: { not: 'T1' }
  }
}, {
  rsql: 'price>20',
  prisma: {
    price: { gt: '20' }
  }
}, {
  rsql: 'price>=20',
  prisma: {
    price: { gte: '20' }
  }
}, {
  rsql: 'price<50',
  prisma: {
    price: { lt: '50' }
  }
}, {
  rsql: 'price<=98',
  prisma: {
    price: { lte: '98' }
  }
}, {
  rsql: 'project=in=(t1,t2,t3)',
  prisma: {
    project: { in: ['t1', 't2', 't3'] }
  }
}]

describe('convert RSQL to prisma queries', () => {
  queries.forEach(({ rsql, prisma }) => {
    it(`should parse "${rsql}"`, () => {
      const result = parse(rsql);
      assert.deepEqual(result, prisma);
    })
  })

  it('should parse logical operator', () => {
    const query = 'project=in=(t1,t2,t3) and price>=23';
    const result = parse(query);
    assert.deepEqual(result, {
      AND: [
        { project: { in: ['t1', 't2', 't3'] } },
        { price: { gte: '23' } },
      ]
    })
  })

  it('should throw exception when the query is invalid', () => {
    assert.throws(() => parse('project=23'));
    assert.throws(() => parse('project=not=23'));
  })

  it('should transform the fields', () => {
    const config = {
      fields: {
        price: (s: string) => Number.parseInt(s)
      },
      defaultQuery: { always: true }
    };
    const result = parse('price>20', config);
    assert.deepEqual(result, {
      price: { gt: 20 }
    })

    const r2 = parse('project=in=(t1)', config);
    assert.deepEqual(r2, { always: true })
  })
})
