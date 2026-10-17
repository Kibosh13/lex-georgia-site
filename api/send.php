<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method']);
    exit;
}

$config = require __DIR__ . '/config.php';

// Honeypot: поле скрыто от людей, боты его заполняют.
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

function field(string $key, int $max = 1000): string
{
    $value = trim((string)($_POST[$key] ?? ''));
    $value = strip_tags($value);
    return mb_substr($value, 0, $max);
}

$form    = field('form', 50) === 'callback' ? 'Обратный звонок' : 'Заявка на консультацию';
$name    = field('name', 120);
$contact = field('contact', 160);
$method  = field('method', 40);
$topic   = field('topic', 120);
$message = field('message', 3000);
$page    = field('page', 200);
$consent = !empty($_POST['consent']);

if ($name === '' || $contact === '' || !$consent) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'validation']);
    exit;
}

$lines = [
    "Новое обращение: {$form}",
    "Имя: {$name}",
    "Контакт: {$contact}",
];
if ($method !== '')  $lines[] = "Удобный способ связи: {$method}";
if ($topic !== '')   $lines[] = "Тема: {$topic}";
if ($message !== '') $lines[] = "Сообщение: {$message}";
$lines[] = "Страница: {$page}";
$lines[] = 'Время: ' . date('d.m.Y H:i');
$text = implode("\n", $lines);

$sent = false;

if (!empty($config['telegram_token']) && !empty($config['telegram_chat_id'])) {
    $url = 'https://api.telegram.org/bot' . $config['telegram_token'] . '/sendMessage';
    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/x-www-form-urlencoded',
        'content' => http_build_query(['chat_id' => $config['telegram_chat_id'], 'text' => $text]),
        'timeout' => 10,
    ]]);
    $result = @file_get_contents($url, false, $ctx);
    $sent = $result !== false && (json_decode($result, true)['ok'] ?? false);
}

if (!empty($config['mail_to'])) {
    $subject = '=?UTF-8?B?' . base64_encode($form . ' с сайта') . '?=';
    $headers = "Content-Type: text/plain; charset=utf-8\r\nFrom: " . $config['mail_from'];
    $sent = @mail($config['mail_to'], $subject, $text, $headers) || $sent;
}

echo json_encode(['ok' => $sent]);
