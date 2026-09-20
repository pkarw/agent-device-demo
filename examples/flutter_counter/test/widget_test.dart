// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:flutter_counter/main.dart';

void main() {
  testWidgets('Reset is disabled at zero', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    expect(
      tester.widget<OutlinedButton>(find.byType(OutlinedButton)).onPressed,
      isNull,
    );
    await tester.tap(find.text('Reset counter'));
    await tester.pump();
    expect(find.text('0'), findsOneWidget);
  });

  testWidgets('Reset clears multiple increments and allows counting again', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());
    for (var i = 0; i < 5; i++) {
      await tester.tap(find.byTooltip('Increment'));
      await tester.pump();
    }
    expect(find.text('5'), findsOneWidget);
    expect(
      tester.widget<OutlinedButton>(find.byType(OutlinedButton)).onPressed,
      isNotNull,
    );

    await tester.tap(find.text('Reset counter'));
    await tester.pump();
    expect(find.text('0'), findsOneWidget);
    expect(find.text('5'), findsNothing);
    expect(
      tester.widget<OutlinedButton>(find.byType(OutlinedButton)).onPressed,
      isNull,
    );

    await tester.tap(find.text('Reset counter'));
    await tester.pump();
    expect(find.text('0'), findsOneWidget);
    await tester.tap(find.byTooltip('Increment'));
    await tester.pump();
    expect(find.text('1'), findsOneWidget);
    expect(
      tester.widget<OutlinedButton>(find.byType(OutlinedButton)).onPressed,
      isNotNull,
    );
  });

  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that our counter starts at 0.
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // Tap the '+' icon and trigger a frame.
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    // Verify that our counter has incremented.
    expect(find.text('0'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });
}
