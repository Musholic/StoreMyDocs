import {Observable, Subscriber, TeardownLogic} from "rxjs";
import {db} from "../app/database/db";

export async function findAsyncSequential<T>(
  array: T[],
  predicate: (t: T) => Promise<boolean>,
): Promise<T | undefined> {
  for (const t of array) {
    if (await predicate(t)) {
      return t;
    }
  }
  return undefined;
}

let notConsumedObservables = new Set<Observable<any>>();

/**
 * Return an asynchronous observable (the call is delayed until next flush or tick call),
 * and ensure the observable is ultimately consumed
 */
export function mustBeConsumedAsyncObservable<T>(value: T, mustBeConsumedAfter: Observable<any> | undefined = undefined): Observable<T> {
  let observable = new TestObservable<T>(subscriber => {
    if (mustBeConsumedAfter) {
      expect(notConsumedObservables.has(mustBeConsumedAfter))
        .withContext("This observable must not be subscribed to until the other observable it depends on has been consumed")
        .toBeFalsy();
    }
    setTimeout(() => {
      notConsumedObservables.delete(observable)
      subscriber.next(value);
      subscriber.complete();
    })
  });
  notConsumedObservables.add(observable);
  return observable;
}

export function verifyObservablesAreConsumed() {
  expect(notConsumedObservables.size).withContext("An observable was not consumed").toEqual(0);
}

export function resetObservablesAreConsumed() {
  notConsumedObservables.clear();
}

/**
 * Add an id to more easily identify a given observable when debugging
 */
class TestObservable<T> extends Observable<T> {

  static lastId = 0;
  private readonly id: number;

  constructor(subscribe: (this: Observable<T>, subscriber: Subscriber<T>) => TeardownLogic) {
    super(subscribe);
    this.id = TestObservable.lastId++;
  }

  // noinspection JSUnusedGlobalSymbols
  getId() {
    return this.id;
  }
}

export async function dbCleanUp() {
  await db.delete();
  db.createSchema();
  await db.open();
}
