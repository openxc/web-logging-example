#!/usr/bin/env python
import unittest

TEST_MODULES = [
    'tests.test_records',
    'tests.test_visualization',
]


def all():
    try:
        return unittest.defaultTestLoader.loadTestsFromNames(TEST_MODULES)
    except AttributeError, e:
        if "'module' object has no attribute 'test_" in str(e):
            # most likely because of an import error
            for m in TEST_MODULES:
                __import__(m, globals(), locals())
        raise


if __name__ == '__main__':
    import tornado.testing
    tornado.testing.main()
