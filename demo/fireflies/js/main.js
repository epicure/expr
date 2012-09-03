var c, gl;
var tendrils = [];
var bandis = [];

var ef_tendril, ef_bandi;
var m_proj, m_view;
var tex_bandi = null;
var vb_quad, tb_quad;

var readyStatus = 0;

var initgl = function(gl) {
	var vs_str = document.querySelector('#vs_tendril').textContent;
	var fs_str = document.querySelector('#fs_tendril').textContent;
	
	ef_tendril = new Effect(gl);
	ef_tendril.compile(vs_str, fs_str);
	ef_tendril.getAttribLocation('position');
	ef_tendril.getUniformLocation('proj', 'view', 'model', 'hsb');

	vs_str = document.querySelector('#vs_bandi').textContent;
	fs_str = document.querySelector('#fs_bandi').textContent;

	ef_bandi = new Effect(gl);
	ef_bandi.compile(vs_str, fs_str);
	ef_bandi.getAttribLocation('position', 'texCoord');
	ef_bandi.getUniformLocation('proj', 'view', 'model', 'map', 'fpsr', 'pos');

	var vertices = new Float32Array([
		-1, 1,
		1, 1,
		-1, -1,
		1, -1
	]);

	vb_quad = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vb_quad);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	var texCoords = new Float32Array([
		0, 0,
		1, 0,
		0, 1,
		1, 1
	]);

	tb_quad = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tb_quad);
	gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

	//proj = mat4.perspective(60, c.width / c.height, 0.01, 100);
	m_view = mat4.lookAt([0,0,10], [0,0,0], [0, 1, 0]);
	m_proj = mat4.ortho(0, c.width, c.height, 0, 0.01, 100);

	gl.useProgram(ef_tendril.program);
	gl.uniformMatrix4fv(ef_tendril.u.proj, false, m_proj);
	gl.uniformMatrix4fv(ef_tendril.u.view, false, m_view);

	gl.useProgram(ef_bandi.program);
	gl.uniformMatrix4fv(ef_bandi.u.proj, false, m_proj);
	gl.uniformMatrix4fv(ef_bandi.u.view, false, m_view);

	gl.viewport(0, 0, c.width, c.height);
	gl.clearColor(0, 0, 0, 1);
};

var do_once = function() {
	initgl(gl);

	var j, cx, t;
	for(j = 0; j < 200; j++) {
		t = new Tendril();
		if(random(0, 1) < 0.2) {
			t.make(random(2, 4), 20, 10, random(1, 3));	
		}
		else {
			t.make(random(1, 3), random(10, 15), random(8, 10), random(1, 3));	
		}
		cx = randomi(0, c.width);
		t.bake(gl);
		t.pos = [cx, c.height + 20, 0];
		t.rot = 0;
		t.to_hsb[0] = random(0.3, 0.5);
		t.to_hsb[1] = random(0.9, 1);
		t.to_hsb[2] = random(0.6, 1);
		tendrils.push(t);
	}

	var b;
	for(j = 0; j < 200; j++) {
		b = new Bandi(gl);
		var theta = random(0, Math.PI * 2);
		b.pos[0] = c.width * 0.5 + c.height * 0.25 * Math.cos(theta);
		b.pos[1] = c.height * 0.5 + c.height * 0.25 * Math.sin(theta);
		b.tendrils = tendrils;
		b.impact();
	
		bandis.push(b);
	}
};

var init = function() {
	c = document.querySelector('#c');
	c.width = window.innerWidth;
	c.height = window.innerHeight;
	gl = c.getContext('experimental-webgl');

	var img_bandi = document.createElement('img');
	img_bandi.src = './texture/bandi.png';
	img_bandi.onload = function(e) {
		tex_bandi = createTexture(gl, img_bandi);
		readyStatus = 1;
	};
};

var update = function() {
	var i, t, b;

	for(i = 0; i < tendrils.length; i++) {
		t = tendrils[i];
		t.update();
	}

	for(i = 0; i < bandis.length; i++) {
		b = bandis[i];
		b.update();
	}
};

var draw = function() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var i, t;

	gl.disable(gl.BLEND);
	gl.useProgram(ef_tendril.program);
	gl.enableVertexAttribArray(ef_tendril.a.position);
	for(i = 0; i < tendrils.length; i++) {
		t = tendrils[i];
		t.draw(gl, ef_tendril);
	}
	
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
	gl.useProgram(ef_bandi.program);

	gl.enableVertexAttribArray(ef_bandi.a.position);
	gl.enableVertexAttribArray(ef_bandi.a.texCoord);
	
	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex_bandi);
	gl.uniform1i(ef_bandi.u.map, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vb_quad);
	gl.vertexAttribPointer(ef_bandi.a.position, 2, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, tb_quad);
	gl.vertexAttribPointer(ef_bandi.a.texCoord, 2, gl.FLOAT, false, 0, 0);
	
	var j = 0;
	while(j < bandis.length) {
		b = bandis[j++];
		b.draw(gl, ef_bandi);
	}
};

var loop = function() {
	if(readyStatus == 1) {
		do_once();
		readyStatus = 2;
	}
	if(readyStatus == 2) {
		update();
		draw();	
	}
	webkitRequestAnimationFrame(loop);
};

window.onload = function() {
	init();
	loop();
};

window.onmousemove = function(e) {
	if(tendrils.length > 0) {
		var i, t;
		for(i = 0; i < tendrils.length; i++) {
			t = tendrils[i];
			t.impact(e.clientX);
		}			
	}
};