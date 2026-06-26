<?php

function get_public_sms_body(): string {
    return '**attach images for best quote** Description:';
}

function get_public_sms_href(): string {
    return 'sms:+15123253525?&body=' . rawurlencode(get_public_sms_body());
}

function get_public_booking_sms_body(): string {
    return 'Book my service on:';
}

function get_public_booking_sms_href(): string {
    return 'sms:+15123253525?&body=' . rawurlencode(get_public_booking_sms_body());
}

function get_public_booking_href(): string {
    return '#';
}